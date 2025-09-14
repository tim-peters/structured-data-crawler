import React, { useState } from 'react';
import { StructuredDataSnippet } from '../types/crawler';
import { StructuredDataCard } from './StructuredDataCard';
import { findRelatedSnippets } from '../services/dataGrouper';
import { getSnippetIcon } from '../utils/iconUtils';
import { 
  ChevronDown, 
  ChevronRight, 
  Link, 
  Globe, 
  GitBranch,
} from 'lucide-react';

interface StructuredDataSnippetCardProps {
  snippet: StructuredDataSnippet;
  allSnippets: StructuredDataSnippet[];
  currentFormatFilter?: string;
}

export function StructuredDataSnippetCard({ snippet, allSnippets, currentFormatFilter = 'all' }: StructuredDataSnippetCardProps) {
  const [showConnections, setShowConnections] = useState(false);
  const [showAllUrls, setShowAllUrls] = useState(false);
  const [showRelatedSnippets, setShowRelatedSnippets] = useState(false);

  const allRelatedSnippets = findRelatedSnippets(snippet, allSnippets);
  const relatedSnippets = currentFormatFilter === 'all' 
    ? allRelatedSnippets 
    : allRelatedSnippets.filter(relatedSnippet => relatedSnippet.format === currentFormatFilter);
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

  const connectionTypeColor = (type: string) => {
    const colors = {
      'reference': 'bg-blue-50 text-blue-700 border-blue-200',
      'sameAs': 'bg-green-50 text-green-700 border-green-200',
      'mainEntity': 'bg-purple-50 text-purple-700 border-purple-200',
      'about': 'bg-orange-50 text-orange-700 border-orange-200',
      'author': 'bg-pink-50 text-pink-700 border-pink-200',
      'publisher': 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    return colors[type as keyof typeof colors] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

const handleAnchorLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetHash: string) => {
  e.preventDefault(); // Verhindere das Standard-Scrollverhalten
  
  // Finde das Ziel-Element
  const targetSnippet = document.getElementById(`snippet-${targetHash}`)
  if (!targetSnippet) return;
  const targetElement = targetSnippet.querySelector('.dataCard');
  if (!targetElement) return;
  
  // Scroll zum Ziel-Element mit Animation
  targetElement.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center' 
  });
  
  // Füge Highlight-Effekt hinzu
  targetElement.classList.add('outline', 'outline-offset-[-3px]', 'outline-blue-500', 'outline-opacity-50', 'rounded-lg');
  
  // Entferne Highlight-Effekt nach 3 Sekunden
  setTimeout(() => {
    targetElement.classList.remove('outline', 'outline-offset-[-3px]', 'outline-blue-500', 'outline-opacity-50', 'rounded-lg');
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

      {/* Connections */}
      {snippet.connections.length > 0 && (
        <div id={`connections-${snippet.hash}`} className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <button
            data-connections-toggle
            aria-expanded={showConnections}
            onClick={() => setShowConnections(!showConnections)}
            className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            {showConnections ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <GitBranch className="w-4 h-4" />
            <span>Connections ({snippet.connections.length})</span>
          </button>

          {showConnections && (
            <div className="mt-3 space-y-2">
              {snippet.connections.map((connection, index) => (
                <a
                  onClick={(e) => handleAnchorLinkClick(e, connection.targetHash)}
                  className={`flex items-center justify-between p-3 cursor-pointer rounded-lg border ${connectionTypeColor(connection.type)} hover:bg-blue-50 hover:text-slate-900 hover:border-blue-300 transition-colors`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium uppercase tracking-wide">
                        {connection.type}
                      </span>
                      <code className="text-xs font-mono bg-white bg-opacity-50 px-1 rounded">
                        {connection.property}
                      </code>
                    </div>
                    <p className="text-sm font-mono truncate">
                      → {connection.value}
                    </p>
                  </div>
                  {connection.targetHash && (
                    <div className="text-xs text-slate-500">
                      Target: <code className="font-mono">{connection.targetHash}</code>
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Related Snippets */}
      {relatedSnippets.length > 0 && (
        <div id={`related-snippets-${snippet.hash}`} className=" px-6 py-4 bg-blue-50 border-t border-slate-100">
          <button
            data-related-toggle
            aria-expanded={showRelatedSnippets}
            onClick={() => setShowRelatedSnippets(!showRelatedSnippets)}
            className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors mb-3"
          >
            {showRelatedSnippets ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <Link className="w-4 h-4" />
            <span>Related Snippets ({relatedSnippets.length})</span>
          </button>
          {showRelatedSnippets && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedSnippets.map((relatedSnippet) => {
                const descriptiveName = getDescriptiveName(relatedSnippet);
                return (
                  <a
                    onClick={(e) => handleAnchorLinkClick(e, relatedSnippet.hash)}
                    className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      {descriptiveName && (
                        <p className="text-sm font-medium text-slate-900 truncate flex-1 mx-2">
                          {descriptiveName.length > 30 ? `${descriptiveName.substring(0, 30)}...` : descriptiveName}
                        </p>
                      )}
                      <Link className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-left space-x-2">
                        {getSnippetIcon(relatedSnippet.type, undefined, "w-4 h-4 ml-2 text-slate-500 flex-shrink-0")}
                        <p className="text-xs text-slate-500 font-mono">
                          {relatedSnippet.type}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formatBadgeColor(relatedSnippet.format)}`}>
                        {relatedSnippet.format}
                      </span>
                    </div>
                    {relatedSnippet.duplicateCount > 1 && (
                      <p className="text-xs text-amber-600 mt-1">
                        {relatedSnippet.duplicateCount} duplicates
                      </p>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}