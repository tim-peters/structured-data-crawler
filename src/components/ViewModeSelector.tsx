import React from 'react';
import { Globe, TreePine, Group, List, Eye, ChevronDown } from 'lucide-react';
import { ViewMode } from '../hooks/useViewData';

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showDropdown: boolean;
  onToggleDropdown: () => void;
}

export function ViewModeSelector({
  viewMode,
  onViewModeChange,
  showDropdown,
  onToggleDropdown
}: ViewModeSelectorProps) {
  const getViewModeLabel = () => {
    switch (viewMode) {
      case 'byUrl': return 'By URL';
      case 'byType': return 'By Type';
      case 'bySnippet': return 'By Snippet';
      case 'byOccurrence': return 'By Occurrence';
      default: return 'Select View';
    }
  };

  const getViewModeIcon = () => {
    switch (viewMode) {
      case 'byUrl': return Globe;
      case 'byType': return TreePine;
      case 'bySnippet': return Group;
      case 'byOccurrence': return List;
      default: return Eye;
    }
  };

  const ViewModeIcon = getViewModeIcon();

  const handleModeSelect = (mode: ViewMode) => {
    onViewModeChange(mode);
    onToggleDropdown();
  };

  return (
    <>
      {/* Desktop View Mode Toggle */}
      <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => onViewModeChange('byUrl')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'byUrl'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>By URL</span>
        </button>
        <button
          onClick={() => onViewModeChange('byType')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'byType'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TreePine className="w-4 h-4" />
          <span>By Type</span>
        </button>
        <button
          onClick={() => onViewModeChange('bySnippet')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'bySnippet'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Group className="w-4 h-4" />
          <span>By Snippet</span>
        </button>
        <button
          onClick={() => onViewModeChange('byOccurrence')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'byOccurrence'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-4 h-4" />
          <span>By Occurrence</span>
        </button>
      </div>

      {/* Mobile View Mode Dropdown */}
      <div className="md:hidden relative">
        <button
          onClick={onToggleDropdown}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-900 font-medium"
        >
          <ViewModeIcon className="w-4 h-4" />
          <span>{getViewModeLabel()}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        
        {showDropdown && (
          <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
            <button
              onClick={() => handleModeSelect('byUrl')}
              className={`flex items-center space-x-2 w-full px-4 py-2 text-left text-sm ${
                viewMode === 'byUrl' ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>By URL</span>
            </button>
            <button
              onClick={() => handleModeSelect('byType')}
              className={`flex items-center space-x-2 w-full px-4 py-2 text-left text-sm ${
                viewMode === 'byType' ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
              }`}
            >
              <TreePine className="w-4 h-4" />
              <span>By Type</span>
            </button>
            <button
              onClick={() => handleModeSelect('bySnippet')}
              className={`flex items-center space-x-2 w-full px-4 py-2 text-left text-sm ${
                viewMode === 'bySnippet' ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
              }`}
            >
              <Group className="w-4 h-4" />
              <span>By Snippet</span>
            </button>
            <button
              onClick={() => handleModeSelect('byOccurrence')}
              className={`flex items-center space-x-2 w-full px-4 py-2 text-left text-sm ${
                viewMode === 'byOccurrence' ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
              <span>By Occurrence</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}