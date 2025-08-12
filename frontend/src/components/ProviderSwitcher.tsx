import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { aiApi } from '../services/api';
import { Loader2, Server, BrainCircuit } from 'lucide-react';
import clsx from 'clsx';

type AIModel = {
  id: string;
  name: string;
  capabilities: string[];
  recommended?: boolean;
};

export default function ProviderSwitcher() {
  const queryClient = useQueryClient();

  const { data: modelsData, isLoading: isLoadingModels } = useQuery({
    queryKey: ['aiModels'],
    queryFn: aiApi.getModels,
  });

  const { data: providerData, isLoading: isLoadingProvider } = useQuery({
    queryKey: ['aiProvider'],
    queryFn: aiApi.getProvider,
  });

  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'gemini'>('openai');
  const [selectedModel, setSelectedModel] = useState('');

  useEffect(() => {
    if (providerData) {
      setSelectedProvider(providerData.provider as 'openai' | 'gemini');
      setSelectedModel(providerData.model);
    }
  }, [providerData]);

  const updateProviderMutation = useMutation({
    mutationFn: aiApi.updateProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProvider'] });
      queryClient.invalidateQueries({ queryKey: ['aiModels'] });
    },
  });

  const handleProviderChange = (provider: 'openai' | 'gemini') => {
    setSelectedProvider(provider);
    // Select the recommended model for the new provider
    const recommendedModel = modelsData?.available_models[provider]?.find((m: AIModel) => m.recommended)?.id;
    if (recommendedModel) {
      setSelectedModel(recommendedModel);
      updateProviderMutation.mutate({ provider, model: recommendedModel });
    } else {
        const firstModel = modelsData?.available_models[provider]?.[0]?.id;
        if(firstModel) {
            setSelectedModel(firstModel);
            updateProviderMutation.mutate({ provider, model: firstModel });
        }
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    updateProviderMutation.mutate({ provider: selectedProvider, model });
  };

  if (isLoadingModels || isLoadingProvider) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        <span className="ml-2 text-sm text-gray-500">Loading AI provider settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
        <div className="flex items-center bg-gray-100 rounded-md p-1 space-x-1">
          <button
            onClick={() => handleProviderChange('openai')}
            className={clsx(
              'px-4 py-2 rounded-md transition-colors w-full text-sm font-medium flex items-center justify-center',
              selectedProvider === 'openai'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Server className="w-4 h-4 mr-2" />
            OpenAI
          </button>
          <button
            onClick={() => handleProviderChange('gemini')}
            className={clsx(
              'px-4 py-2 rounded-md transition-colors w-full text-sm font-medium flex items-center justify-center',
              selectedProvider === 'gemini'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <BrainCircuit className="w-4 h-4 mr-2" />
            Google Gemini
          </button>
        </div>
      </div>

      {modelsData && (
        <div>
          <label htmlFor="ai_model" className="block text-sm font-medium text-gray-700 mb-2">
            AI Model
          </label>
          <select
            id="ai_model"
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="form-select"
            disabled={updateProviderMutation.isLoading}
          >
            {modelsData.available_models[selectedProvider]?.map((model: AIModel) => (
              <option key={model.id} value={model.id}>
                {model.name} {model.recommended && '(Recommended)'}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}