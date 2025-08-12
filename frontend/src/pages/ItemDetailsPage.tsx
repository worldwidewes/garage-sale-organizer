import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Upload, Save, X, Sparkles } from 'lucide-react';
import { useItem, useUpdateItem, useDeleteItem, useUploadImage } from '../hooks/useItems';
import ImageUpload, { ImageGallery } from '../components/ImageUpload';
import type { Item } from '../services/api';

export default function ItemDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editData, setEditData] = useState<Partial<Item>>({});

  const { data: item, isLoading, error } = useItem(id!);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const uploadImage = useUploadImage();

  const handleEdit = () => {
    setEditData({
      title: item?.title || '',
      description: item?.description || '',
      category: item?.category || '',
      price: item?.price || 0,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!id) return;
    
    try {
      await updateItem.mutateAsync({ id, updates: editData });
      setIsEditing(false);
      setEditData({});
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await deleteItem.mutateAsync(id);
      navigate('/items');
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!id) return;
    
    try {
      const result = await uploadImage.mutateAsync({ itemId: id, file });
      
      // If AI analysis provided suggestions and we're not editing, offer to apply them
      if (result.ai_analysis && !isEditing) {
        const analysis = result.ai_analysis;
        const shouldUpdate = confirm(
          `AI has analyzed the new image and suggests updates:\n\n` +
          `Title: "${analysis.title}"\n` +
          `Description: "${analysis.description}"\n` +
          `Category: "${analysis.category}"\n` +
          `Price: $${analysis.estimated_price}\n\n` +
          `Would you like to apply these suggestions?`
        );
        
        if (shouldUpdate) {
          const updates: Partial<Item> = {};
          if (analysis.title && analysis.title !== item?.title) updates.title = analysis.title;
          if (analysis.description && analysis.description !== item?.description) updates.description = analysis.description;
          if (analysis.category && analysis.category !== item?.category) updates.category = analysis.category;
          if (analysis.estimated_price && analysis.estimated_price !== item?.price) updates.price = analysis.estimated_price;
          
          if (Object.keys(updates).length > 0) {
            await updateItem.mutateAsync({ id, updates });
          }
        }
      }
      
      setShowUpload(false);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading item...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          Item not found or failed to load.
        </div>
        <Link to="/items" className="btn btn-primary">
          Back to Items
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/items')}
            className="btn btn-secondary inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Items
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.title || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="form-input text-2xl font-bold"
                  placeholder="Item title"
                />
              ) : (
                item.title
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              Added {new Date(item.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {!isEditing ? (
            <>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="btn btn-secondary inline-flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Add Photo
              </button>
              <button
                onClick={handleEdit}
                className="btn btn-secondary inline-flex items-center"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger inline-flex items-center"
                disabled={deleteItem.isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="btn btn-secondary inline-flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary inline-flex items-center"
                disabled={updateItem.isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Image Upload */}
      {showUpload && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Add Photo</h2>
            <button
              onClick={() => setShowUpload(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <ImageUpload
            onUpload={handleImageUpload}
            isUploading={uploadImage.isLoading}
          />
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">
                  AI-Powered Enhancement
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  When you upload a photo, our AI will analyze it and offer suggestions to improve your listing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Photos</h2>
          {item.images && item.images.length > 0 ? (
            <ImageGallery images={item.images} />
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No photos uploaded yet</p>
              <button
                onClick={() => setShowUpload(true)}
                className="btn btn-primary mt-4"
              >
                Add Photos
              </button>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={editData.description || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    className="form-textarea"
                    placeholder="Describe the item"
                  />
                ) : (
                  <p className="text-gray-900">
                    {item.description || 'No description provided'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.category || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                      className="form-select"
                    >
                      <option value="">Select category</option>
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
                  ) : (
                    <p className="text-gray-900">
                      {item.category || 'Uncategorized'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editData.price || 0}
                        onChange={(e) => setEditData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="form-input pl-8"
                        placeholder="0.00"
                      />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-green-600">
                      ${item.price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}