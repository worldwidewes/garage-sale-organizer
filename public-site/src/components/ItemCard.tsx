import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import type { Item, ItemImage } from '../../../shared/types';

interface ItemCardProps {
  item: Item & { images: ItemImage[] };
  size?: 'small' | 'medium' | 'large';
}

export default function ItemCard({ item, size = 'medium' }: ItemCardProps) {
  const primaryImage = item.images?.[0];
  
  const sizeClasses = {
    small: 'aspect-square',
    medium: 'aspect-square sm:aspect-[4/3]',
    large: 'aspect-[4/3] sm:aspect-[3/2]',
  };

  const textSizes = {
    small: {
      title: 'text-sm font-medium',
      price: 'text-lg font-semibold',
      category: 'text-xs',
    },
    medium: {
      title: 'text-base font-medium',
      price: 'text-xl font-semibold',
      category: 'text-sm',
    },
    large: {
      title: 'text-lg font-medium',
      price: 'text-2xl font-bold',
      category: 'text-sm',
    },
  };

  return (
    <Link to={`/item/${item.id}`} className="block group">
      <div className="card hover:shadow-lg transition-shadow duration-200">
        <div className={sizeClasses[size]}>
          {primaryImage ? (
            <img
              src={`/uploads/thumbnails/${primaryImage.filename}`}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `/uploads/images/${primaryImage.filename}`;
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className={`${textSizes[size].title} text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors`}>
            {item.title}
          </h3>
          
          <div className="flex items-center justify-between mb-2">
            <span className={`${textSizes[size].price} price-tag`}>
              ${item.price.toFixed(2)}
            </span>
            
            {item.category && (
              <span className={`category-tag ${textSizes[size].category}`}>
                {item.category}
              </span>
            )}
          </div>
          
          {item.description && size !== 'small' && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-2">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}