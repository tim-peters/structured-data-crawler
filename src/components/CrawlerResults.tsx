import React, { useState, useMemo } from 'react';
import { StructuredDataItem, StructuredDataGroup } from '../types/crawler';
import { StructuredDataCard } from './StructuredDataCard';
import { StructuredDataGroupCard } from './StructuredDataGroupCard';
import { Filter, Search, Download, Eye, Group, List } from 'lucide-react';

interface CrawlerResultsProps {
  data: StructuredDataItem[];
  groupedData: StructuredDataGroup[];
}

export function CrawlerResults({ data, groupedData }: CrawlerResultsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'individual'>('grouped');

  // Get unique types and formats
  const { types, formats } = useMemo(() => {
    const typeSet = new Set<string>();
    const formatSet = new Set<string>();
    
    data.forEach(item => {
      if (item.type) typeSet.add(item.type);
      formatSet.add(item.format);
    });
    
    return {
      types: Array.from(typeSet).sort(),
      formats: Array.from(formatSet).sort()
    };
  }, [data]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(item.data).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesFormat = selectedFormat === 'all' || item.format === selectedFormat;
      
      return matchesSearch && matchesType && matchesFormat;
    });
  }, [data, searchTerm, selectedType, selectedFormat]);

  // Filter grouped data
  const filteredGroupedData = useMemo(() => {
    return groupedData.filter(group => {
      const matchesSearch = searchTerm === '' || 
        group.items.some(item => 
          item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          JSON.stringify(item.data).toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesType = selectedType === 'all' || group.type === selectedType;
      const matchesFormat = selectedFormat === 'all' || group.format === selectedFormat;
      
      return matchesSearch && matchesType && matchesFormat;
    });
  }, [groupedData, searchTerm, selectedType, selectedFormat]);

  const exportData = () => {
    const exportObj = {
      crawledAt: new Date().toISOString(),
      totalItems: data.length,
      individualData: filteredData,
      groupedData: groupedData
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `structured-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Discovered Structured Data
          </h2>
          <p className="text-slate-600 mt-1">
            Found {data.length} items in {groupedData.length} groups
            {viewMode === 'grouped' 
              ? ` (showing ${filteredGroupedData.length} groups)`
              : ` (showing ${filteredData.length} items)`
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grouped'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Group className="w-4 h-4" />
              <span>Grouped</span>
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'individual'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Individual</span>
            </button>
          </div>
          
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
        </div>
        
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
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
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
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

      {/* Results Grid */}
      {viewMode === 'grouped' ? (
        filteredGroupedData.length > 0 ? (
          <div className="space-y-6">
            {filteredGroupedData.map((group) => (
              <StructuredDataGroupCard 
                key={group.hash} 
                group={group} 
                allGroups={groupedData}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Groups Found</h3>
            <p className="text-slate-500">
              Try adjusting your search terms or filters to see more results.
            </p>
          </div>
        )
      ) : (
        filteredData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredData.map((item, index) => (
            <StructuredDataCard key={`${item.url}-${index}`} item={item} />
          ))}
        </div>
        ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Results Found</h3>
          <p className="text-slate-500">
            Try adjusting your search terms or filters to see more results.
          </p>
        </div>
        )
      )}
    </div>
  );
}