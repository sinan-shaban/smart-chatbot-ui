import { Message } from '@/types/chat';
import { ApiError, ApiErrorBody, ErrorResponseCode } from '@/types/error';
import { OpenAIModel, OpenAIModelID } from '@/types/openai';



import { OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '../app/const';



import { ParsedEvent, ReconnectInterval, createParser } from 'eventsource-parser';


export class OpenAIError extends ApiError {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }

  getApiError(): ApiErrorBody {
    let errorCode: ErrorResponseCode;
    switch (this.code) {
      case "429":
        errorCode = ErrorResponseCode.OPENAI_RATE_LIMIT_REACHED;
        break;
      case "503":
        errorCode = ErrorResponseCode.OPENAI_SERVICE_OVERLOADED;
        break;
      default:
        errorCode = ErrorResponseCode.ERROR_DEFAULT;
        break;
    }
    return { error: { code: errorCode, message: this.message } };
  }
}

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature: number,
  key: string,
  messages: Message[],
  maxTokens: number,
) => {
  let url = `${OPENAI_API_HOST}/v1/chat/completions`;
  if (OPENAI_API_TYPE === 'azure') {
    url = `${OPENAI_API_HOST}/openai/deployments/${model.azureDeploymentId}/chat/completions?api-version=${OPENAI_API_VERSION}`;
  }

  const msgs = messages.map((m) => {
    try {
      return {
        role: m.role,
        content: JSON.parse(m.content),
      };
    } catch (e) {
      return {
        role: m.role,
        content: m.content,
      };
      }
  });

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(OPENAI_API_TYPE === 'openai' && {
        Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`,
      }),
      ...(OPENAI_API_TYPE === 'azure' && {
        'api-key': `${key ? key : process.env.OPENAI_API_KEY}`,
      }),
      ...(OPENAI_API_TYPE === 'openai' &&
        OPENAI_ORGANIZATION && {
          'OpenAI-Organization': OPENAI_ORGANIZATION,
        }),
    },
    method: 'POST',
    body: JSON.stringify({
      ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...msgs,
      ],
      ...(model.id === OpenAIModelID.GPT_4_VISION ? {max_tokens: 4000} : {}),
      temperature: temperature,
      stream: true,
    }),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;
          if (data !== '[DONE]') {
            try {
              const json = JSON.parse(data);
              if (json.choices[0].finish_reason != null || json.choices[0].finish_details != null) {
                controller.close();
                return;
              }
              const text = json.choices[0].delta.content;
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              controller.error(e);
            }
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        const content = decoder.decode(chunk)
        if (content.trim() === "data: [DONE]") {
          controller.close();
        } else {
          parser.feed(content);
        }
      }
    },
  });

  return stream;
};


export const DallERequest = async (
  model: OpenAIModel,
  prompt: string,
  size?: string | null | undefined,
  style?: string | null | undefined,
  quality?: string | null | undefined,
) => {
  let url = `${OPENAI_API_HOST}/v1/images/generations`;

  const body = {
    model: model.id,
    prompt: prompt,
    response_format: 'b64_json',
    style: style ?? 'natural',
    size: size ?? '1024x1024',
    quality: quality ?? 'standard'
  };

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error`,
      );
    }
  }

  const result = await res.json();
  return result;
};
