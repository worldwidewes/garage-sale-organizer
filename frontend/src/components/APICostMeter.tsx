import React, { useState } from 'react';
import { ChevronDown, DollarSign, Zap, Activity, RefreshCw, AlertCircle } from 'lucide-react';
import { useAIUsage } from '../hooks/useAIUsage';
import clsx from 'clsx';

interface APICostMeterProps {
  className?: string;
}

export default function APICostMeter({ className }: APICostMeterProps) {
  const { usage, models, loading, error, updateModel, refresh } = useAIUsage();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!models?.ai_initialized) {
    return (
      <div className={clsx('flex items-center space-x-2 text-gray-500', className)}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">AI Not Configured</span>
      </div>
    );
  }

  const currentModel = models?.available_models.find(m => m.id === models.current_model);
  const formatCost = (cost: number) => `$${cost.toFixed(2)}`;
  const formatTokens = (tokens: number) => tokens.toLocaleString();

  const handleModelChange = async (modelId: string) => {
    setIsUpdating(true);
    const success = await updateModel(modelId);
    if (success) {
      setShowDropdown(false);
    }
    setIsUpdating(false);
  };

  return (
    <div className={clsx('flex items-center space-x-4', className)}>
      {/* Cost Display */}
      <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
        <DollarSign className="w-4 h-4 text-green-600" />
        <div className="text-sm">
          <span className="font-medium text-green-800">
            {usage ? formatCost(usage.total_cost) : '$0.00'}
          </span>
          <span className="text-green-600 ml-1">session</span>
        </div>
      </div>

      {/* Token Count */}
      <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
        <Zap className="w-4 h-4 text-blue-600" />
        <div className="text-sm">
          <span className="font-medium text-blue-800">
            {usage ? formatTokens(usage.total_tokens) : '0'}
          </span>
          <span className="text-blue-600 ml-1">tokens</span>
        </div>
      </div>

      {/* Request Count */}
      <div className="flex items-center space-x-2 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
        <Activity className="w-4 h-4 text-purple-600" />
        <div className="text-sm">
          <span className="font-medium text-purple-800">
            {usage?.total_requests || 0}
          </span>
          <span className="text-purple-600 ml-1">requests</span>
        </div>
      </div>

      {/* Model Selector */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isUpdating}
          className={clsx(
            'flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors',
            isUpdating && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-sm font-medium text-gray-700">
            {currentModel?.name || 'Unknown Model'}
          </span>
          <ChevronDown className={clsx(
            'w-4 h-4 text-gray-500 transition-transform',
            showDropdown && 'rotate-180'
          )} />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">SELECT AI MODEL</div>
              {models?.available_models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  disabled={isUpdating}
                  className={clsx(
                    'w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors relative',
                    model.id === models.current_model && 'bg-blue-50 border border-blue-200',
                    isUpdating && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{model.name}</span>
                        {model.recommended && (
                          <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                        {model.id === models.current_model && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Input: ${model.pricing.input}/1K tokens</span>
                        <span>Output: ${model.pricing.output}/1K tokens</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <button
        onClick={refresh}
        disabled={loading}
        className={clsx(
          'p-1.5 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors',
          loading && 'opacity-50 cursor-not-allowed'
        )}
        title="Refresh usage data"
      >
        <RefreshCw className={clsx('w-4 h-4 text-gray-600', loading && 'animate-spin')} />
      </button>

      {/* Error Display */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}