import { Grid, List } from 'lucide-react';
import clsx from 'clsx';
import type { ViewMode } from '../services/api';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-gray-100 rounded-md p-1">
      <button
        onClick={() => onViewModeChange('grid')}
        className={clsx(
          'p-2 rounded transition-colors',
          viewMode === 'grid'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
        title="Grid view"
      >
        <Grid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={clsx(
          'p-2 rounded transition-colors',
          viewMode === 'list'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
        title="List view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}