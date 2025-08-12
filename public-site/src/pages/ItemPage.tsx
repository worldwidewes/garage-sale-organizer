import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Tag, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import ItemCard from '../components/ItemCard';
import { publicApi } from '../services/api';
import type { Item, ItemImage } from '../../../shared/types';

export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<(Item & { images: ItemImage[] }) | null>(null);
  const [relatedItems, setRelatedItems] = useState<(Item & { images: ItemImage[] })[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      publicApi.getItem(id),
      publicApi.getItems(),
    ])
    .then(([itemData, allItems]) => {
      setItem(itemData);
      
      // Get related items (same category, different item)
      const related = allItems
        .filter(relatedItem => 
          relatedItem.id !== itemData.id && 
          relatedItem.category === itemData.category
        )
        .slice(0, 4);
      setRelatedItems(related);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [id]);

  const nextImage = () => {
    if (item && item.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }
  };

  const prevImage = () => {
    if (item && item.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading item...</p>
        </div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Item Not Found</h1>
          <p className="text-gray-600 mb-8">
            The item you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          {item.category && (
            <>
              <Link to={`/category/${encodeURIComponent(item.category)}`} className="hover:text-gray-700">
                {item.category}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900">{item.title}</span>
        </div>

        <button
          onClick={() => window.history.back()}
          className="btn btn-secondary inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {item.images.length > 0 ? (
                <>
                  <img
                    src={`/uploads/images/${item.images[currentImageIndex].filename}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {item.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-90 rounded-full p-2 shadow-md transition-all"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-90 rounded-full p-2 shadow-md transition-all"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                      </button>
                      
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 rounded-full px-3 py-1">
                        <span className="text-white text-sm">
                          {currentImageIndex + 1} / {item.images.length}
                        </span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {item.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {item.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex
                        ? 'border-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={`/uploads/thumbnails/${image.filename}`}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `/uploads/images/${image.filename}`;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {item.title}
              </h1>
              
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-4xl font-bold text-green-600">
                  ${item.price.toFixed(2)}
                </span>
                
                {item.category && (
                  <Link
                    to={`/category/${encodeURIComponent(item.category)}`}
                    className="category-tag hover:bg-blue-200 transition-colors"
                  >
                    <Tag className="w-4 h-4 mr-1" />
                    {item.category}
                  </Link>
                )}
              </div>
            </div>

            {item.description && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                Listed {new Date(item.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                Interested in this item?
              </h3>
              <p className="text-blue-700 mb-4">
                Visit us at our garage sale to purchase this item and browse many more!
              </p>
              <Link to="/" className="btn btn-primary">
                View All Items
              </Link>
            </div>
          </div>
        </div>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              More {item.category} Items
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedItems.map((relatedItem) => (
                <ItemCard key={relatedItem.id} item={relatedItem} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}