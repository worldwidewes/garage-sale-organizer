import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';

interface CategoryFilterProps {
  categories: string[];
  itemCounts?: { [category: string]: number };
}

export default function CategoryFilter({ categories, itemCounts }: CategoryFilterProps) {
  const { category: activeCategory } = useParams();

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
      
      <div className="space-y-2">
        <Link
          to="/"
          className={clsx(
            'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
            !activeCategory
              ? 'bg-blue-100 text-blue-800'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          All Items
          {itemCounts && (
            <span className="ml-2 text-xs text-gray-500">
              ({Object.values(itemCounts).reduce((sum, count) => sum + count, 0)})
            </span>
          )}
        </Link>
        
        {categories.map((category) => (
          <Link
            key={category}
            to={`/category/${encodeURIComponent(category)}`}
            className={clsx(
              'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
              activeCategory === category
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            {category}
            {itemCounts && itemCounts[category] && (
              <span className="ml-2 text-xs text-gray-500">
                ({itemCounts[category]})
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}