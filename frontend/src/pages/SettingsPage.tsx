import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Sparkles, ExternalLink } from 'lucide-react';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import ProviderSwitcher from '../components/ProviderSwitcher';

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  
  const [formData, setFormData] = useState({
    openai_api_key: '',
    gemini_api_key: '',
    garage_sale_title: '',
    garage_sale_date: '',
    garage_sale_address: '',
    contact_info: '',
  });
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        openai_api_key: settings.openai_api_key === '***CONFIGURED***' ? '' : settings.openai_api_key || '',
        gemini_api_key: settings.gemini_api_key === '***CONFIGURED***' ? '' : settings.gemini_api_key || '',
        garage_sale_title: settings.garage_sale_title || '',
        garage_sale_date: settings.garage_sale_date || '',
        garage_sale_address: settings.garage_sale_address || '',
        contact_info: settings.contact_info || '',
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataToSubmit: Partial<typeof formData> = { ...formData };
      // Only send API key if it was changed
      if (settings?.openai_api_key === '***CONFIGURED***' && !formData.openai_api_key) {
        delete dataToSubmit.openai_api_key;
      }
      if (settings?.gemini_api_key === '***CONFIGURED***' && !formData.gemini_api_key) {
        delete dataToSubmit.gemini_api_key;
      }
      
      await updateSettings.mutateAsync(dataToSubmit);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const isConfigured = settings?.openai_api_key === '***CONFIGURED***' || formData.openai_api_key;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure your garage sale and AI features
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* AI Configuration */}
        <div className="card">
          <div className="flex items-center mb-6">
            <Sparkles className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-lg font-medium text-gray-900">AI Configuration</h2>
              <p className="text-sm text-gray-600">
                Configure OpenAI integration for automatic image analysis and description generation
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <ProviderSwitcher />

            <div className="pt-4 space-y-6">
              <div>
                <label htmlFor="openai_api_key" className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    id="openai_api_key"
                    value={formData.openai_api_key}
                    onChange={(e) => handleInputChange('openai_api_key', e.target.value)}
                    className="form-input pr-12"
                    placeholder={settings?.openai_api_key === '***CONFIGURED***' ? 'API key is configured' : 'sk-...'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Get your API key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500 inline-flex items-center"
                  >
                    OpenAI Platform
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </p>
              </div>

              <div>
                <label htmlFor="gemini_api_key" className="block text-sm font-medium text-gray-700 mb-2">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    id="gemini_api_key"
                    value={formData.gemini_api_key}
                    onChange={(e) => handleInputChange('gemini_api_key', e.target.value)}
                    className="form-input pr-12"
                    placeholder={settings?.gemini_api_key === '***CONFIGURED***' ? 'API key is configured' : 'Enter your Gemini API key'}
                  />
                   <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Get your API key from{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500 inline-flex items-center"
                  >
                    Google AI Studio
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </p>
              </div>
            </div>

            {isConfigured && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Sparkles className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">
                      AI Features Enabled
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Your images will be automatically analyzed to generate titles, descriptions, categories, and price estimates.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Garage Sale Information */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Garage Sale Information
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            This information will be displayed on your public garage sale website.
          </p>

          <div className="space-y-6">
            <div>
              <label htmlFor="garage_sale_title" className="block text-sm font-medium text-gray-700 mb-2">
                Sale Title
              </label>
              <input
                type="text"
                id="garage_sale_title"
                value={formData.garage_sale_title}
                onChange={(e) => handleInputChange('garage_sale_title', e.target.value)}
                className="form-input"
                placeholder="e.g., Smith Family Garage Sale"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="garage_sale_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Sale Date
                </label>
                <input
                  type="text"
                  id="garage_sale_date"
                  value={formData.garage_sale_date}
                  onChange={(e) => handleInputChange('garage_sale_date', e.target.value)}
                  className="form-input"
                  placeholder="e.g., Saturday, March 15th, 8 AM - 4 PM"
                />
              </div>

              <div>
                <label htmlFor="contact_info" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Info
                </label>
                <input
                  type="text"
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => handleInputChange('contact_info', e.target.value)}
                  className="form-input"
                  placeholder="e.g., Call (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label htmlFor="garage_sale_address" className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                id="garage_sale_address"
                rows={3}
                value={formData.garage_sale_address}
                onChange={(e) => handleInputChange('garage_sale_address', e.target.value)}
                className="form-textarea"
                placeholder="e.g., 123 Main Street, Anytown, CA 12345"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end space-x-4">
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary inline-flex items-center"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Public Site
          </a>
          <button
            type="submit"
            className="btn btn-primary inline-flex items-center"
            disabled={updateSettings.isLoading}
          >
            {updateSettings.isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            )}
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </button>
        </div>
      </form>

      {updateSettings.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Settings saved successfully!</p>
        </div>
      )}
    </div>
  );
}