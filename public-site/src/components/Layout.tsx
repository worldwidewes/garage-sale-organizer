import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Phone, Search } from 'lucide-react';
import { publicApi } from '../services/api';
import SearchBar from './SearchBar';

interface LayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
}

export default function Layout({ children, showSearch = true }: LayoutProps) {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    publicApi.getSettings().then(setSettings).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold text-gray-900">
              {settings?.garage_sale_title || 'Garage Sale'}
            </Link>
            
            {showSearch && (
              <div className="hidden md:block flex-1 max-w-lg mx-8">
                <SearchBar />
              </div>
            )}
          </div>
          
          {/* Mobile search */}
          {showSearch && (
            <div className="md:hidden pb-4">
              <SearchBar />
            </div>
          )}
        </div>
      </header>

      {/* Sale Info Banner */}
      {settings && (settings.garage_sale_date || settings.garage_sale_address || settings.contact_info) && (
        <div className="bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              {settings.garage_sale_date && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {settings.garage_sale_date}
                </div>
              )}
              
              {settings.garage_sale_address && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {settings.garage_sale_address}
                </div>
              )}
              
              {settings.contact_info && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  {settings.contact_info}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="text-lg font-medium mb-2">
              {settings?.garage_sale_title || 'Garage Sale'}
            </p>
            <p className="text-sm">
              Browse items online, then visit us for great deals!
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}