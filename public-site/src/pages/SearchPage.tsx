import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, X } from 'lucide-react';
import Layout from '../components/Layout';
import ItemGrid from '../components/ItemGrid';
import CategoryFilter from '../components/CategoryFilter';
import SearchBar from '../components/SearchBar';
import { publicApi } from '../services/api';
import type { Item, ItemImage, SearchParams as SearchParamsType } from '../../../shared/types';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<(Item & { images: ItemImage[] })[]>([]);
  const [allItems, setAllItems] = useState<(Item & { images: ItemImage[] })[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('min_price');
  const maxPrice = searchParams.get('max_price');
  const sortBy = searchParams.get('sort') || 'created_at';

  const [filters, setFilters] = useState({
    min_price: minPrice ? parseFloat(minPrice) : undefined,
    max_price: maxPrice ? parseFloat(maxPrice) : undefined,
    sort_by: sortBy as 'created_at' | 'price' | 'title',
    sort_order: 'desc' as 'asc' | 'desc',
  });

  useEffect(() => {
    const searchFilters: SearchParamsType = {
      query: query || undefined,
      category: category || undefined,
      ...filters,
    };

    Promise.all([
      publicApi.getItems(searchFilters),
      publicApi.getItems(), // Get all items for category counts
      publicApi.getCategories(),
    ])
    .then(([filteredItems, allItemsData, categoriesData]) => {
      setItems(filteredItems);
      setAllItems(allItemsData);
      setCategories(categoriesData);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [query, category, filters]);

  const handleSearch = (newQuery: string) => {
    const params = new URLSearchParams(searchParams);
    if (newQuery) {
      params.set('q', newQuery);
    } else {
      params.delete('q');
    }
    setSearchParams(params);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      min_price: undefined,
      max_price: undefined,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.delete('category');
      params.delete('min_price');
      params.delete('max_price');
      params.delete('sort');
      return params;
    });
  };

  const hasActiveFilters = query || category || filters.min_price !== undefined || filters.max_price !== undefined;

  // Count items by category
  const itemCounts = allItems.reduce((counts, item) => {
    if (item.category) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, {} as { [category: string]: number });

  return (
    <Layout showSearch={false}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="btn btn-secondary inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-center">
            <Search className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {query ? `Search: "${query}"` : 'Browse All Items'}
              </h1>
              <p className="text-gray-600 mt-1">
                {loading ? 'Searching...' : `${items.length} item${items.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl">
          <SearchBar initialQuery={query} onSearch={handleSearch} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary inline-flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-secondary inline-flex items-center text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams);
                    if (e.target.value) {
                      params.set('category', e.target.value);
                    } else {
                      params.delete('category');
                    }
                    setSearchParams(params);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} ({itemCounts[cat] || 0})
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="$0.00"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="$999.99"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with Categories */}
          <div className="lg:col-span-1">
            <CategoryFilter categories={categories} itemCounts={itemCounts} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <ItemGrid
              items={items}
              loading={loading}
              emptyMessage={query ? `No results for "${query}"` : "No items found"}
              emptyDescription={query ? "Try different search terms or browse categories." : "Try adjusting your filters or browse categories."}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}