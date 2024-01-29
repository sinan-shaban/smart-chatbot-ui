import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';

import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import {DallERequest, OpenAIStream} from '@/utils/server';
import { saveLlmUsage, verifyUserLlmUsage } from '@/utils/server/llmUsage';
import { ensureHasValidSession, getUserHash } from '@/utils/server/auth';
import { createMessagesToSend } from '@/utils/server/message';
import { getTiktokenEncoding } from '@/utils/server/tiktoken';
import { getErrorResponseBody } from '@/utils/server/error';

import { ChatBodySchema } from '@/types/chat';

import { authOptions } from '@/pages/api/auth/[...nextauth]';

import path from 'node:path';
import loggerFn from 'pino';
import {OpenAIModelID} from "@/types/openai";

const logger = loggerFn({ name: 'chat' });

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '200mb' // Set desired value here
    }
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Vercel Hack
  // https://github.com/orgs/vercel/discussions/1278
  // eslint-disable-next-line no-unused-vars
  const vercelFunctionHack = path.resolve('./public', '');

  if (!(await ensureHasValidSession(req, res))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }


  const userId = await getUserHash(req, res);
  const { model, messages, key, prompt, temperature, size = '1024x1024', style = 'natural', quality = 'standard' } = ChatBodySchema.parse(
    req.body,
  );

  const session = await getServerSession(req, res, authOptions);
  if (session && process.env.AUDIT_LOG_ENABLED === 'true') {
    logger.info({ event: 'chat', user: session.user, model: model.name, image_size: size, image_style: style, image_quality: quality});
  }

  try {
    if (model.id !== OpenAIModelID.DALL_E_2 && model.id !== OpenAIModelID.DALL_E_3 ) {
      await verifyUserLlmUsage(userId, model.id);
    }
  } catch (e: any) {
    return res.status(429).json({ error: e.message });
  }

  const encoding = await getTiktokenEncoding(model.id);
  try {
    let systemPromptToSend = prompt;
    if (!systemPromptToSend) {
      systemPromptToSend = DEFAULT_SYSTEM_PROMPT;
    }
    let { messages: messagesToSend, maxToken, tokenCount } = createMessagesToSend(
      encoding,
      model,
      systemPromptToSend,
      1000,
      messages,
    );
    if (messagesToSend.length === 0) {
      throw new Error('message is too long');
    }

    if(model.id === OpenAIModelID.DALL_E_2 || model.id === OpenAIModelID.DALL_E_3) {
      const result = await DallERequest(model, messages[messages.length - 1].content, size, style, quality);
      res.status(200);
      res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Encoding': 'none',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
      });
      res.write(JSON.stringify({type: "image_url", image_url: {url: result.data[0].b64_json}}));
      res.end();
    } else {
      const stream = await OpenAIStream(
        model,
        systemPromptToSend,
        temperature,
        key,
        messagesToSend,
        maxToken,
      );
      res.status(200);
      res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Encoding': 'none',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
      });
      const decoder = new TextDecoder();
      const reader = stream.getReader();
      let closed = false;
      let responseText = "";
      while (!closed) {
        await reader.read().then(({done, value}) => {
          if (done) {
            closed = true;
            res.end();
          } else {
            const text = decoder.decode(value);
            responseText += text;
            res.write(text);
          }
        });
      }
      const completionTokenCount = encoding.encode(responseText).length;
      await saveLlmUsage(userId, model.id, "chat", {
        prompt: tokenCount,
        completion: completionTokenCount,
        total: tokenCount + completionTokenCount
      })
    }
  } catch (error) {
    console.error(error);
    const errorRes = getErrorResponseBody(error);
    res.status(500).json(errorRes);
  } finally {
    encoding.free();
  }
};


export default handler;
