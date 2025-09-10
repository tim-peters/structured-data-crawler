import React, { useState } from 'react';
import { StructuredDataSnippet } from '../types/crawler';
import { StructuredDataCard } from './StructuredDataCard';
import { getSnippetIcon } from '../utils/iconUtils';
import { Globe } from 'lucide-react';

interface StructuredDataSnippetCardProps {
  snippet: StructuredDataSnippet;
  allSnippets: StructuredDataSnippet[];
}

export function StructuredDataSnippetCard({ snippet, allSnippets }: StructuredDataSnippetCardProps) {
  const [showAllUrls, setShowAllUrls] = useState(false);

  const uniqueUrls = [...new Set(snippet.items.map(item => item.url))];

  // Helper function to extract descriptive name from structured data
  const getDescriptiveName = (snippet: StructuredDataSnippet): string => {
    if (!snippet.items || snippet.items.length === 0) return '';
    
    const data = snippet.items[0].data;
    
    // Try different common attributes in order of preference
    const candidates = [
      data.title,
      data.name,
      data.headline,
      data['og:title'],
      data['twitter:title'],
      data.label,
      data.description?.substring(0, 50),
      data['og:description']?.substring(0, 50),
      data.url,
      data['@id']
    ];
    
    // Find the first non-empty candidate
    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
    
    // For nested objects, try to extract from mainEntity or similar
    if (data.mainEntity) {
      const nestedCandidates = [
        data.mainEntity.name,
        data.mainEntity.title,
        data.mainEntity.headline
      ];
      
      for (const candidate of nestedCandidates) {
        if (candidate && typeof candidate === 'string' && candidate.trim()) {
          return candidate.trim();
        }
      }
    }
    
    return '';
  };

  return (
    <div 
      id={`snippet-${snippet.hash}`}
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      {/* Snippet Header */}
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-3">
                <div className="flex items-center justify-center py-2 px-3 bg-slate-100 rounded-lg">
                  {getSnippetIcon(snippet.type)}
                {/* Add descriptiveName as a title */}
                {getDescriptiveName(snippet) && (
                  <p className="text-lg font-medium text-slate-900 ml-2">
                    {getDescriptiveName(snippet).length > 60
                      ? `${getDescriptiveName(snippet).substring(0, 60)}...`
                      : getDescriptiveName(snippet)}
                  </p>
                )}
              </div>
            </div>
            {/* URLs */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Found on {uniqueUrls.length} page{uniqueUrls.length !== 1 ? 's' : ''}:</p>
              <div className="flex flex-wrap gap-2">
                {(showAllUrls ? uniqueUrls : uniqueUrls.slice(0, 3)).map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{new URL(url).pathname || '/'}</span>
                  </a>
                ))}
                {!showAllUrls && uniqueUrls.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllUrls(true)}
                    className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md hover:bg-slate-200 transition-colors"
                  >
                    +{uniqueUrls.length - 3} more
                  </button>
                )}
                {showAllUrls && uniqueUrls.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllUrls(false)}
                    className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md hover:bg-slate-200 transition-colors"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snippet Items */}
      <div className="p-6">
        <div className="space-y-4">
          {snippet.items.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <StructuredDataCard 
                item={snippet.items[0]} 
                allData={[]}
                allSnippets={allSnippets}
                compact 
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}