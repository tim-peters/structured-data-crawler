import React from 'react';
import { Filter, Search, ChevronDown } from 'lucide-react';
import { FilterOptions } from '../hooks/useFilteredData';

interface FilterBarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  types: string[];
  formats: string[];
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function FilterBar({
  filters,
  onFiltersChange,
  types,
  formats,
  showFilters,
  onToggleFilters
}: FilterBarProps) {
  const updateFilter = (key: keyof FilterOptions, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <button
        onClick={onToggleFilters}
        className="w-full px-6 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
        </div>
        <ChevronDown className={`md:hidden w-5 h-5 text-slate-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
      </button>
      
      <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
        <div className="px-6 pb-6 md:pt-0 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  placeholder="Search URLs, types, or content..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data Type
              </label>
              <select
                value={filters.selectedType}
                onChange={(e) => updateFilter('selectedType', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Format Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Format
              </label>
              <select
                value={filters.selectedFormat}
                onChange={(e) => updateFilter('selectedFormat', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Formats</option>
                {formats.map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}