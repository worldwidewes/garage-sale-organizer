import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { Package, DollarSign, Eye, Plus, Settings as SettingsIcon } from 'lucide-react';
import { useItems } from '../hooks/useItems';
import { useSettings } from '../hooks/useSettings';
import ItemCard from '../components/ItemCard';

export default function Dashboard() {
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const { data: settings } = useSettings();

  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + item.price, 0);
  const recentItems = items.slice(0, 6);

  const stats = [
    {
      name: 'Total Items',
      value: totalItems.toString(),
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      name: 'Total Value',
      value: `$${totalValue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to your garage sale organizer
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/items/new" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Add New Item</h3>
              <p className="text-sm text-gray-500">Upload photos and create listings</p>
            </div>
          </div>
        </Link>

        <Link to="/items" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Manage Items</h3>
              <p className="text-sm text-gray-500">View and edit your listings</p>
            </div>
          </div>
        </Link>

        <a
          href="http://localhost:3001"
          target="_blank"
          rel="noopener noreferrer"
          className="card hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Preview Site</h3>
              <p className="text-sm text-gray-500">See your public garage sale</p>
            </div>
          </div>
        </a>

        <Link to="/settings" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Settings</h3>
              <p className="text-sm text-gray-500">Configure AI and sale info</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Configuration Alert */}
      {settings && !settings.openai_api_key && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <SettingsIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                AI Features Not Configured
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Add your OpenAI API key in settings to enable automatic image analysis and description generation.
              </p>
              <div className="mt-3">
                <Link
                  to="/settings"
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-700 underline"
                >
                  Configure now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Items</h2>
            <Link
              to="/items"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalItems === 0 && !itemsLoading && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No items yet
          </h3>
          <p className="text-gray-500 mb-6">
            Get started by adding your first garage sale item.
          </p>
          <Link to="/items/new" className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Item
          </Link>
        </div>
      )}
    </div>
  );
}