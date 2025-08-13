import { useState, useEffect } from 'react';
import { aiApi } from '../services/api';

interface AIModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    input: number;
    output: number;
    currency: string;
    per: number;
  };
  capabilities: string[];
  recommended: boolean;
}

interface AIUsageStats {
  total_cost: number;
  total_tokens: number;
  total_requests: number;
  operations: {
    image_analysis: { count: number; cost: number; tokens: number };
    description_generation: { count: number; cost: number; tokens: number };
  };
  session_start: string;
}

interface AIModelsResponse {
  available_models: {
    openai: AIModel[];
    gemini: AIModel[];
  };
  current_provider: 'openai' | 'gemini';
  current_model: string;
  ai_initialized: boolean;
}

export function useAIUsage() {
  const [usage, setUsage] = useState<AIUsageStats | null>(null);
  const [models, setModels] = useState<AIModelsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await aiApi.getUsage();
      setUsage(data);
    } catch (err: any) {
      console.error('Failed to fetch AI usage:', err);
      setError(err.response?.data?.error || 'Failed to fetch usage data');
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      setError(null);
      const data = await aiApi.getModels();
      setModels(data);
    } catch (err: any) {
      console.error('Failed to fetch AI models:', err);
      setError(err.response?.data?.error || 'Failed to fetch models');
    }
  };

  const updateModel = async (modelId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current provider from models state
      const provider = models?.current_provider || 'openai';
      await aiApi.updateProvider({ provider, model: modelId });
      
      // Refresh models data to get updated current_model
      await fetchModels();
      
      return true;
    } catch (err: any) {
      console.error('Failed to update model:', err);
      setError(err.response?.data?.error || 'Failed to update model');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    fetchModels();
    
    // Set up polling to update usage every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    usage,
    models,
    loading,
    error,
    fetchUsage,
    fetchModels,
    updateModel,
    refresh: () => {
      fetchUsage();
      fetchModels();
    }
  };
}