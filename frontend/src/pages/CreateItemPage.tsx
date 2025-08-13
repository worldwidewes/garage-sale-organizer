import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Save, ArrowLeft, Sparkles } from 'lucide-react';
import { useCreateItem, useUploadImage } from '../hooks/useItems';
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

  const createItem = useCreateItem();
  const uploadImage = useUploadImage();
  const { data: categories = [] } = useQuery(['categories'], categoriesApi.getAll);

  const handleInputChange = (field: keyof CreateItemRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0]; // For create page, just use the first file
    debugUpload('Image upload initiated from UI', { fileName: file.name, fileSize: file.size });
    setIsUploadingUI(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setUploadMessage('Starting upload...');
    
    try {
      if (!createItem.data?.id) {
        debugUI('Creating new item first');
        // Create item first if it doesn't exist
        const newItem = await createItem.mutateAsync(formData);
        debugUI('Item created successfully', { itemId: newItem.id });
        
        // Upload image with progress tracking
        const result = await uploadImage.mutateAsync({ 
          itemId: newItem.id, 
          file,
          onProgress: (progress) => {
            debugUpload('Progress update', progress);
            setUploadProgress(progress.uploadProgress);
            setUploadStatus(progress.status);
            setUploadMessage(progress.message);
          }
        });
        
        // Update form with AI analysis if available
        if (result.ai_analysis) {
          const analysis = result.ai_analysis;
          debugAI('AI analysis received, updating form fields', analysis);
          setFormData(prev => ({
            ...prev,
            title: prev.title || analysis.title || '',
            description: prev.description || analysis.description || '',
            category: prev.category || analysis.category || '',
            price: prev.price || analysis.estimated_price || 0,
          }));
        } else {
          debugAI('No AI analysis returned');
        }
        
        setUploadedImages(prev => [...prev, result.image]);
      } else {
        debugUI('Using existing item', { itemId: createItem.data.id });
        // Item already exists, just upload image
        const result = await uploadImage.mutateAsync({ 
          itemId: createItem.data.id, 
          file,
          onProgress: (progress) => {
            debugUpload('Progress update', progress);
            setUploadProgress(progress.uploadProgress);
            setUploadStatus(progress.status);
            setUploadMessage(progress.message);
          }
        });
        setUploadedImages(prev => [...prev, result.image]);
      }
      
      // Complete the progress
      debugUI('Upload complete, cleaning up UI state');
      setUploadProgress(100);
      setUploadStatus('complete');
      setUploadMessage('Upload complete!');
      
      // Reset progress after a short delay
      setTimeout(() => {
        setIsUploadingUI(false);
        setUploadProgress(0);
        setUploadStatus(undefined);
        setUploadMessage(undefined);
        debugUI('UI state reset complete');
      }, 2000);
      
    } catch (error) {
      debugUI('Upload failed, resetting UI state', error);
      console.error('Upload failed:', error);
      setIsUploadingUI(false);
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

  const isLoading = createItem.isLoading || uploadImage.isLoading;
  const hasAISuggestions = uploadedImages.some(img => img.ai_analysis);

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
          <p className="text-gray-600">Upload photos and let AI help create your listing</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Image Upload */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Photos</h2>
          <ImageUpload
            onUpload={handleImageUpload}
            isUploading={isUploadingUI}
            uploadProgress={uploadProgress}
            uploadStatus={uploadStatus}
            uploadMessage={uploadMessage}
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
          
          {hasAISuggestions && (
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