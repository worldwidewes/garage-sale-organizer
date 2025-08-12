import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import Layout from '../components/Layout';
import ItemCard from '../components/ItemCard';
import CategoryFilter from '../components/CategoryFilter';
import { publicApi } from '../services/api';
import type { Item, ItemImage } from '../../../shared/types';

export default function HomePage() {
  const [items, setItems] = useState<(Item & { images: ItemImage[] })[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      publicApi.getItems({ sort_by: 'created_at', sort_order: 'desc' }),
      publicApi.getCategories(),
      publicApi.getSettings(),
    ])
    .then(([itemsData, categoriesData, settingsData]) => {
      setItems(itemsData);
      setCategories(categoriesData);
      setSettings(settingsData);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const featuredItems = items.slice(0, 8);
  const recentItems = items.slice(0, 12);
  
  // Count items by category
  const itemCounts = items.reduce((counts, item) => {
    if (item.category) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, {} as { [category: string]: number });

  return (
    <Layout>
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            {settings?.garage_sale_title || 'Welcome to Our Garage Sale'}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Browse our items online before you visit! Find great deals on quality items.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {items.length > 0 && (
              <Link 
                to="/search" 
                className="btn btn-primary text-lg px-8 py-4 inline-flex items-center"
              >
                Browse All Items
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            )}
          </div>
          
          {items.length > 0 && (
            <div className="mt-8 text-sm text-gray-600">
              <p>
                <span className="font-semibold text-gray-900">{items.length}</span> items available
                {settings?.garage_sale_date && (
                  <>
                    {' • '}
                    <span className="font-semibold text-gray-900">{settings.garage_sale_date}</span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Items Coming Soon!
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              We're still adding items to our garage sale. Check back soon for great deals!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar with Categories */}
              <div className="lg:col-span-1">
                <CategoryFilter categories={categories} itemCounts={itemCounts} />
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-12">
                {/* Featured Items */}
                {featuredItems.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <Star className="w-6 h-6 text-yellow-500 mr-2" />
                        <h2 className="text-2xl font-bold text-gray-900">Featured Items</h2>
                      </div>
                      {items.length > featuredItems.length && (
                        <Link 
                          to="/search" 
                          className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
                        >
                          View All
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                      {featuredItems.map((item) => (
                        <ItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Categories Preview */}
                {categories.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {categories.slice(0, 8).map((category) => {
                        const categoryItems = items.filter(item => item.category === category);
                        const sampleItem = categoryItems[0];
                        
                        return (
                          <Link
                            key={category}
                            to={`/category/${encodeURIComponent(category)}`}
                            className="card hover:shadow-lg transition-shadow duration-200 group"
                          >
                            <div className="aspect-square">
                              {sampleItem?.images?.[0] ? (
                                <img
                                  src={`/uploads/thumbnails/${sampleItem.images[0].filename}`}
                                  alt={category}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `/uploads/images/${sampleItem.images[0].filename}`;
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                  <span className="text-4xl">📦</span>
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                {category}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {itemCounts[category] || 0} item{(itemCounts[category] || 0) !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}