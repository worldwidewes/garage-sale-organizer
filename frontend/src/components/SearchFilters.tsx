import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { SearchParams } from '../services/api';

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchParams) => void;
  categories: string[];
  loading?: boolean;
}

export default function SearchFilters({ onFiltersChange, categories, loading }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchParams>({
    query: '',
    category: '',
    min_price: undefined,
    max_price: undefined,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const handleFilterChange = (key: keyof SearchParams, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchParams = {
      query: '',
      category: '',
      min_price: undefined,
      max_price: undefined,
      sort_by: 'created_at',
      sort_order: 'desc',
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setIsOpen(false);
  };

  const hasActiveFilters = filters.query || filters.category || 
    filters.min_price !== undefined || filters.max_price !== undefined;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search items..."
            value={filters.query || ''}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`btn ${isOpen ? 'btn-primary' : 'btn-secondary'} inline-flex items-center`}
          disabled={loading}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {[filters.query, filters.category, filters.min_price, filters.max_price]
                .filter(Boolean).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn btn-secondary inline-flex items-center"
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </button>
        )}
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="form-select"
              disabled={loading}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={filters.min_price || ''}
              onChange={(e) => handleFilterChange('min_price', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="form-input"
              placeholder="$0.00"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={filters.max_price || ''}
              onChange={(e) => handleFilterChange('max_price', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="form-input"
              placeholder="$999.99"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={`${filters.sort_by}-${filters.sort_order}`}
              onChange={(e) => {
                const [sort_by, sort_order] = e.target.value.split('-');
                handleFilterChange('sort_by', sort_by);
                handleFilterChange('sort_order', sort_order);
              }}
              className="form-select"
              disabled={loading}
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="title-asc">Name: A to Z</option>
              <option value="title-desc">Name: Z to A</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}