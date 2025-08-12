import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Tag } from 'lucide-react';
import Layout from '../components/Layout';
import ItemGrid from '../components/ItemGrid';
import CategoryFilter from '../components/CategoryFilter';
import { publicApi } from '../services/api';
import type { Item, ItemImage } from '../../../shared/types';

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [items, setItems] = useState<(Item & { images: ItemImage[] })[]>([]);
  const [allItems, setAllItems] = useState<(Item & { images: ItemImage[] })[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const decodedCategory = category ? decodeURIComponent(category) : '';

  useEffect(() => {
    Promise.all([
      publicApi.getItems(),
      publicApi.getCategories(),
    ])
    .then(([itemsData, categoriesData]) => {
      setAllItems(itemsData);
      setCategories(categoriesData);
      
      // Filter items by category
      const filteredItems = itemsData.filter(item => item.category === decodedCategory);
      setItems(filteredItems);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [decodedCategory]);

  // Count items by category
  const itemCounts = allItems.reduce((counts, item) => {
    if (item.category) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, {} as { [category: string]: number });

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="btn btn-secondary inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-center">
            <Tag className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {decodedCategory}
              </h1>
              <p className="text-gray-600 mt-1">
                {loading ? 'Loading...' : `${items.length} item${items.length !== 1 ? 's' : ''} in this category`}
              </p>
            </div>
          </div>
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
              emptyMessage={`No items in ${decodedCategory}`}
              emptyDescription="Try browsing other categories or check back later."
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}