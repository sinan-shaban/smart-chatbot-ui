import { IconExternalLink } from '@tabler/icons-react';
import { useContext } from 'react';

import { useTranslation } from 'next-i18next';

import useConversations from '@/hooks/useConversations';

import {OpenAIModel, OpenAIModelID, OpenAIModelType} from '@/types/openai';

import HomeContext from '@/pages/api/home/home.context';

export const ImageQualitySelect = () => {
  const { t } = useTranslation('chat');
  const [_, conversationsAction] = useConversations();

  const {
    state: { selectedConversation, models, defaultQuality, isAzureOpenAI },
  } = useContext(HomeContext);

  const allOptions: { [key in OpenAIModelID]?: string[] } = {
    [OpenAIModelID.DALL_E_2]: ['Standard'],
    [OpenAIModelID.DALL_E_3]: ['Standard', 'HD'],
  }

  let currentOptions: string[] = [];
  if(selectedConversation?.model?.id && [OpenAIModelID.DALL_E_2, OpenAIModelID.DALL_E_3].includes(selectedConversation?.model?.id as OpenAIModelID)) {
    currentOptions = allOptions[selectedConversation?.model?.id] ?? [];
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectedConversation &&
      conversationsAction.updateValue(selectedConversation, {
        key: 'quality',
        value: e.target.value
      });
  };

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
        {t('Quality')}
      </label>
      <div className="w-full rounded-lg border border-neutral-200 bg-transparent pr-2 text-neutral-900 dark:border-neutral-600 dark:text-white">
        <select
          className="w-full bg-transparent p-2"
          placeholder={t('Select image quality') || ''}
          value={selectedConversation?.quality || defaultQuality}
          onChange={handleChange}
        >
          {currentOptions.map((option) => (
            <option
              key={option}
              value={option.toLowerCase()}
              className="dark:bg-[#343541] dark:text-white"
            >
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
