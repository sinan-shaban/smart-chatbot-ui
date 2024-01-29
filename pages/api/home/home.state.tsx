import { MutableRefObject } from 'react';

import { Conversation, Message } from '@/types/chat';
import { ChatModeKey } from '@/types/chatmode';
import { FolderInterface } from '@/types/folder';
import { OpenAIModel, OpenAIModelID } from '@/types/openai';
import { Prompt } from '@/types/prompt';
import { Settings } from '@/types/settings';

export interface HomeInitialState {
  apiKey: string;
  chatModeKeys: ChatModeKey[];
  loading: boolean;
  settings: Settings;
  messageIsStreaming: boolean;
  modelError: Error | null;
  models: OpenAIModel[];
  folders: FolderInterface[];
  publicFolders: FolderInterface[];
  conversations: Conversation[];
  selectedConversation: Conversation | undefined;
  currentMessage: Message | undefined;
  prompts: Prompt[];
  publicPrompts: Prompt[];
  showChatbar: boolean;
  showPromptbar: boolean;
  currentFolder: FolderInterface | undefined;
  messageError: boolean;
  searchTerm: string;
  defaultModelId: OpenAIModelID | undefined;
  defaultStyle: string;
  defaultSize: string;
  defaultQuality: string;
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;
  stopConversationRef: MutableRefObject<boolean>;
  isAzureOpenAI: boolean;
  supportEmail: string;
  promptSharingEnabled: boolean;
}

export const initialState: Partial<HomeInitialState> = {
  apiKey: '',
  loading: false,
  chatModeKeys: [],
  settings: {
    userId: '',
    theme: 'dark',
    defaultTemperature: 1.0,
  },
  messageIsStreaming: false,
  modelError: null,
  models: [],
  folders: [],
  publicFolders: [],
  conversations: [],
  selectedConversation: undefined,
  currentMessage: undefined,
  prompts: [],
  publicPrompts: [],
  showPromptbar: true,
  showChatbar: true,
  currentFolder: undefined,
  messageError: false,
  searchTerm: '',
  defaultModelId: undefined,
  defaultStyle: 'natural',
  defaultSize: '1024x1024',
  defaultQuality: 'standard',
  serverSideApiKeyIsSet: false,
  serverSidePluginKeysSet: false,
  isAzureOpenAI: false,
  supportEmail: '',
  promptSharingEnabled: false,
};
