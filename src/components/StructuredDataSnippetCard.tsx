import React, { useState } from 'react';
import { StructuredDataSnippet } from '../types/crawler';
import { StructuredDataCard } from './StructuredDataCard';
import { findIncomingReferences } from '../services/dataGrouper';
import { getSnippetIcon } from '../utils/iconUtils';
import { 
  ChevronDown, 
  ChevronRight, 
  ArrowRight,
  ArrowLeft,
  Globe, 
} from 'lucide-react';

interface StructuredDataSnippetCardProps {
  snippet: StructuredDataSnippet;
  allSnippets: StructuredDataSnippet[];
  currentFormatFilter?: string;
}

export function StructuredDataSnippetCard({ snippet, allSnippets, currentFormatFilter = 'all' }: StructuredDataSnippetCardProps) {
  const [showOutgoingReferences, setShowOutgoingReferences] = useState(false);
  const [showIncomingReferences, setShowIncomingReferences] = useState(false);
  const [showAllUrls, setShowAllUrls] = useState(false);

  // Find snippets that this snippet references (outgoing)
  const outgoingSnippets = allSnippets.filter(otherSnippet => 
    snippet.connections.some(conn => conn.targetHash === otherSnippet.hash)
  );
  
  // Find snippets that reference this snippet (incoming)
  const incomingSnippets = findIncomingReferences(snippet, allSnippets);
  
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

  const formatBadgeColor = (format: string) => {
    const colors = {
      'JSON-LD': 'bg-blue-100 text-blue-800',
      'Microdata': 'bg-green-100 text-green-800',
      'RDFa': 'bg-purple-100 text-purple-800',
      'OpenGraph': 'bg-orange-100 text-orange-800',
      'Twitter Cards': 'bg-cyan-100 text-cyan-800',
      'Schema.org': 'bg-indigo-100 text-indigo-800',
      'Mixed': 'bg-slate-100 text-slate-800'
    };
    return colors[format as keyof typeof colors] || 'bg-slate-100 text-slate-800';
  };

  const handleConnectionClick = (targetHash: string) => {
    // Find the target snippet element
    const targetElement = document.getElementById(`snippet-${targetHash}`);
    if (!targetElement) return;
  
    // Scroll to the target element
    targetElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Add highlight effect
    targetElement.classList.add('outline', 'outline-offset-[-3px]', 'outline-blue-500', 'outline-opacity-50', 'rounded-xl');
    
    // Remove highlight effect after 3 seconds
    setTimeout(() => {
      targetElement.classList.remove('outline', 'outline-offset-[-3px]', 'outline-blue-500', 'outline-opacity-50', 'rounded-xl');
    }, 3000);
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

      {/* Outgoing References */}
      {outgoingSnippets.length > 0 && (
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <button
            onClick={() => setShowOutgoingReferences(!showOutgoingReferences)}
            className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            {showOutgoingReferences ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <ArrowRight className="w-4 h-4" />
            <span>References ({outgoingSnippets.length})</span>
          </button>

          {showOutgoingReferences && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {outgoingSnippets.map((referencedSnippet) => {
                const descriptiveName = getDescriptiveName(referencedSnippet);
                return (
                  <button
                    key={referencedSnippet.hash}
                    onClick={() => handleConnectionClick(referencedSnippet.hash)}
                    className="bg-white rounded-lg p-3 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer group text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      {descriptiveName && (
                        <p className="text-sm font-medium text-slate-900 truncate flex-1 mx-2">
                          {descriptiveName.length > 30 ? `${descriptiveName.substring(0, 30)}...` : descriptiveName}
                        </p>
                      )}
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-left space-x-2">
                        {getSnippetIcon(referencedSnippet.type, undefined, "w-4 h-4 ml-2 text-slate-500 flex-shrink-0")}
                        <p className="text-xs text-slate-500 font-mono">
                          {referencedSnippet.type}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formatBadgeColor(referencedSnippet.format)}`}>
                        {referencedSnippet.format}
                      </span>
                    </div>
                    {referencedSnippet.duplicateCount > 1 && (
                      <p className="text-xs text-amber-600 mt-1">
                        {referencedSnippet.duplicateCount} duplicates
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Incoming References */}
      {incomingSnippets.length > 0 && (
        <div className="px-6 py-4 bg-blue-50 border-t border-slate-100">
          <button
            onClick={() => setShowIncomingReferences(!showIncomingReferences)}
            className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors mb-3"
          >
            {showIncomingReferences ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <ArrowLeft className="w-4 h-4" />
            <span>Referenced By ({incomingSnippets.length})</span>
          </button>
          {showIncomingReferences && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incomingSnippets.map((referencingSnippet) => {
                const descriptiveName = getDescriptiveName(referencingSnippet);
                return (
                  <button
                    key={referencingSnippet.hash}
                    onClick={() => handleConnectionClick(referencingSnippet.hash)}
                    className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer group text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      {descriptiveName && (
                        <p className="text-sm font-medium text-slate-900 truncate flex-1 mx-2">
                          {descriptiveName.length > 30 ? `${descriptiveName.substring(0, 30)}...` : descriptiveName}
                        </p>
                      )}
                      <ArrowLeft className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-left space-x-2">
                        {getSnippetIcon(referencingSnippet.type, undefined, "w-4 h-4 ml-2 text-slate-500 flex-shrink-0")}
                        <p className="text-xs text-slate-500 font-mono">
                          {referencingSnippet.type}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formatBadgeColor(referencingSnippet.format)}`}>
                        {referencingSnippet.format}
                      </span>
                    </div>
                    {referencingSnippet.duplicateCount > 1 && (
                      <p className="text-xs text-amber-600 mt-1">
                        {referencingSnippet.duplicateCount} duplicates
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}