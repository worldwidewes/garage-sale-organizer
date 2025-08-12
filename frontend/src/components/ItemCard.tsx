import { Link } from 'react-router-dom';
import { Package, DollarSign, Tag, Calendar } from 'lucide-react';
import type { Item, ItemImage } from '../services/api';

interface ItemCardProps {
  item: Item & { images?: ItemImage[] };
  viewMode?: 'grid' | 'list';
}

export default function ItemCard({ item, viewMode = 'grid' }: ItemCardProps) {
  const primaryImage = item.images?.[0];
  
  if (viewMode === 'list') {
    return (
      <Link to={`/items/${item.id}`} className="block">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {primaryImage ? (
                <img
                  src={`/uploads/thumbnails/${primaryImage.filename}`}
                  alt={item.title}
                  className="w-20 h-20 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `/uploads/images/${primaryImage.filename}`;
                  }}
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                {item.description || 'No description'}
              </p>
              
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="w-4 h-4 mr-1" />
                  ${item.price.toFixed(2)}
                </div>
                
                {item.category && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Tag className="w-4 h-4 mr-1" />
                    {item.category}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/items/${item.id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square">
          {primaryImage ? (
            <img
              src={`/uploads/thumbnails/${primaryImage.filename}`}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `/uploads/images/${primaryImage.filename}`;
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-gray-900 truncate mb-2">
            {item.title}
          </h3>
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-green-600">
              ${item.price.toFixed(2)}
            </span>
            
            {item.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {item.category}
              </span>
            )}
          </div>
          
          {item.description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}