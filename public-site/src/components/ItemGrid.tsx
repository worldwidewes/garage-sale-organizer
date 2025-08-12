import { Package } from 'lucide-react';
import ItemCard from './ItemCard';
import type { Item, ItemImage } from '../../../shared/types';

interface ItemGridProps {
  items: (Item & { images: ItemImage[] })[];
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
}

export default function ItemGrid({ 
  items, 
  loading, 
  emptyMessage = "No items found",
  emptyDescription = "Try browsing different categories or adjusting your search."
}: ItemGridProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading items...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-6" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-600 max-w-sm mx-auto">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}