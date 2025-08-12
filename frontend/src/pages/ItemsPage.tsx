import { useState } from 'react';
import { useQuery } from 'react-query';
import { Package, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useItems } from '../hooks/useItems';
import { categoriesApi } from '../services/api';
import ItemCard from '../components/ItemCard';
import SearchFilters from '../components/SearchFilters';
import ViewToggle from '../components/ViewToggle';
import type { SearchParams, ViewMode } from '../services/api';

export default function ItemsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<SearchParams>({
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const { data: items = [], isLoading: itemsLoading, error } = useItems(filters);
  const { data: categories = [] } = useQuery(['categories'], categoriesApi.getAll);

  const handleFiltersChange = (newFilters: SearchParams) => {
    setFilters(newFilters);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          Error loading items. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items</h1>
          <p className="text-gray-600 mt-1">
            Manage your garage sale inventory
          </p>
        </div>
        <Link to="/items/new" className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Link>
      </div>

      <SearchFilters
        onFiltersChange={handleFiltersChange}
        categories={categories}
        loading={itemsLoading}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {itemsLoading ? (
            'Loading items...'
          ) : (
            `${items.length} item${items.length !== 1 ? 's' : ''} found`
          )}
        </div>
        
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {itemsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {Object.values(filters).some(Boolean) ? 'No items match your search' : 'No items yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {Object.values(filters).some(Boolean) 
              ? 'Try adjusting your search filters.'
              : 'Get started by adding your first garage sale item.'
            }
          </p>
          <Link to="/items/new" className="btn btn-primary inline-flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Link>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}