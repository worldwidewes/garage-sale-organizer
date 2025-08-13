import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Save, ArrowLeft, Sparkles, Loader } from 'lucide-react';
import { useCreateItem, useUploadImageOnly, useAnalyzeAllImages } from '../hooks/useItems';
import { categoriesApi } from '../services/api';
import ImageUpload, { ImageGallery } from '../components/ImageUpload';
import type { CreateItemRequest } from '../services/api';
import { debugUI, debugAI, debugUpload } from '../utils/debug';

export default function CreateItemPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateItemRequest>({
    title: '',
    description: '',
    category: '',
    price: 0,
  });
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'processing' | 'analyzing' | 'generating' | 'complete'>();
  const [uploadMessage, setUploadMessage] = useState<string>();
  const [isUploadingUI, setIsUploadingUI] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const createItem = useCreateItem();
  const uploadImageOnly = useUploadImageOnly();
  const analyzeAllImages = useAnalyzeAllImages();
  const { data: categories = [] } = useQuery(['categories'], categoriesApi.getAll);

  const handleInputChange = (field: keyof CreateItemRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFilesSelected = async (files: File[]) => {
    // Auto-upload files immediately when selected
    debugUpload('Auto-uploading selected files', { fileCount: files.length });
    
    setIsUploadingUI(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setUploadMessage('Starting upload...');
    
    try {
      let item = createItem.data;
      
      if (!item) {
        debugUI('Creating new item first');
        item = await createItem.mutateAsync(formData);
        debugUI('Item created successfully', { itemId: item.id });
      }
      
      const totalFiles = files.length;
      let processedFiles = 0;
      
      for (const file of files) {
        debugUpload(`Uploading file ${processedFiles + 1}/${totalFiles}`, { fileName: file.name });
        
        const result = await uploadImageOnly.mutateAsync({ 
          itemId: item.id, 
          file,
          onProgress: (progress) => {
            debugUpload('Progress update', progress);
            const overallProgress = ((processedFiles / totalFiles) * 100) + ((progress.uploadProgress / totalFiles));
            setUploadProgress(overallProgress);
            setUploadStatus('uploading');
            setUploadMessage(`Uploading... (${processedFiles + 1}/${totalFiles})`);
          }
        });
        
        setUploadedImages(prev => [...prev, result.image]);
        processedFiles++;
      }
      
      setUploadProgress(100);
      setUploadStatus('complete');
      setUploadMessage(`${totalFiles} image${totalFiles > 1 ? 's' : ''} uploaded successfully!`);
      
      // Reset progress after a short delay
      setTimeout(() => {
        setIsUploadingUI(false);
        setUploadProgress(0);
        setUploadStatus(undefined);
        setUploadMessage(undefined);
        debugUI('Auto-upload UI state reset complete');
      }, 2000);
      
    } catch (error) {
      debugUI('Auto-upload failed, resetting UI state', error);
      console.error('Auto-upload failed:', error);
      setIsUploadingUI(false);
      setUploadProgress(0);
      setUploadStatus(undefined);
      setUploadMessage(undefined);
    }
  };


  const handleAnalyzeWithAI = async () => {
    if (!createItem.data?.id || uploadedImages.length === 0) return;
    
    debugAI('Starting AI analysis for all uploaded images', { 
      itemId: createItem.data.id, 
      imageCount: uploadedImages.length 
    });
    
    setIsAnalyzing(true);
    setUploadProgress(0);
    setUploadStatus('analyzing');
    setUploadMessage('Analyzing images with AI...');
    
    try {
      const result = await analyzeAllImages.mutateAsync(createItem.data.id);
      
      debugAI('AI analysis complete, updating form fields', result.analysis);
      
      // Update form with AI analysis
      setFormData(prev => ({
        ...prev,
        title: prev.title || result.analysis.title || '',
        description: prev.description || result.analysis.description || '',
        category: prev.category || result.analysis.category || '',
        price: prev.price || result.analysis.estimated_price || 0,
      }));
      
      setUploadProgress(100);
      setUploadStatus('complete');
      setUploadMessage('AI analysis complete!');
      setHasAnalyzed(true);
      
      // Reset progress after a short delay
      setTimeout(() => {
        setIsAnalyzing(false);
        setUploadProgress(0);
        setUploadStatus(undefined);
        setUploadMessage(undefined);
        debugAI('AI analysis UI state reset complete');
      }, 2000);
      
    } catch (error) {
      debugAI('AI analysis failed', error);
      console.error('AI analysis failed:', error);
      setIsAnalyzing(false);
      setUploadProgress(0);
      setUploadStatus(undefined);
      setUploadMessage(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let item = createItem.data;
      
      if (!item) {
        // Create the item
        item = await createItem.mutateAsync(formData);
      }
      
      // Navigate to the item details page
      navigate(`/items/${item.id}`);
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  const isLoading = createItem.isLoading || uploadImageOnly.isLoading;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/items')}
          className="btn btn-secondary inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Items
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Item</h1>
          <p className="text-gray-600">Photos upload automatically, then analyze with AI to create your listing</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Image Upload */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Photos</h2>
          <ImageUpload
            onUpload={handleFilesSelected}
            isUploading={isUploadingUI}
            uploadProgress={uploadProgress}
            uploadStatus={uploadStatus}
            uploadMessage={uploadMessage}
            multiple={true}
          />
          
          {uploadedImages.length > 0 && (
            <div className="mt-6">
              <ImageGallery
                images={uploadedImages}
                onDelete={(imageId) => {
                  setUploadedImages(prev => prev.filter(img => img.id !== imageId));
                }}
              />
            </div>
          )}
          
          {uploadedImages.length > 0 && !hasAnalyzed && !isUploadingUI && !isAnalyzing && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Sparkles className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      {uploadedImages.length} Image{uploadedImages.length > 1 ? 's' : ''} Ready
                    </p>
                    <p className="text-sm text-green-700">
                      Analyze with AI to get suggested titles, descriptions, and pricing?
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAnalyzeWithAI}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center transition-colors"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze with AI
                </button>
              </div>
            </div>
          )}
          

          {(isAnalyzing || (isUploadingUI && uploadStatus === 'analyzing')) && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <Loader className="w-5 h-5 text-blue-600 animate-spin mr-3" />
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-blue-700">
                    {uploadMessage || 'Analyzing images with AI...'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {hasAnalyzed && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">
                    AI Analysis Complete
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    We've analyzed your photos and suggested item details below. Feel free to edit them.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Item Details Form */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Item Details</h2>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="form-input"
              placeholder="Enter item title"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="form-textarea"
              placeholder="Describe the item's condition, features, and any notable details"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="form-select"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Toys">Toys</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Sports">Sports</option>
                <option value="Tools">Tools</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Collectibles">Collectibles</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="price"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className="form-input pl-8"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/items')}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center"
              disabled={isLoading || !formData.title || !formData.price}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}