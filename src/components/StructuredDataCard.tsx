import React, { useState } from 'react';
import { StructuredDataItem, StructuredDataSnippet } from '../types/crawler';
import { groupStructuredData, findRelatedSnippets } from '../services/dataGrouper';
import { getSnippetIcon } from '../utils/iconUtils';
import { ExternalLink, ChevronDown, ChevronRight, Copy, Check, Link, GitBranch } from 'lucide-react';

interface StructuredDataCardProps {
  item: StructuredDataItem;
  allData?: StructuredDataItem[];
  compact?: boolean;
  showUrl?: boolean;
  currentFormatFilter?: string;
}

export function StructuredDataCard({ item, allData = [], compact = false, showUrl = false, currentFormatFilter = 'all' }: StructuredDataCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showRelatedSnippets, setShowRelatedSnippets] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate snippet data to find connections and related snippets
  const snippetData = allData.length > 0 ? groupStructuredData(allData) : [];
  const currentSnippet = snippetData.find(snippet => snippet.hash === item.hash);
  const connections = currentSnippet?.connections || [];
  
  const allRelatedSnippets = currentSnippet ? findRelatedSnippets(currentSnippet, snippetData) : [];
  const relatedSnippets = currentFormatFilter === 'all' 
    ? allRelatedSnippets 
    : allRelatedSnippets.filter(relatedSnippet => relatedSnippet.format === currentFormatFilter);

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(item.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatJsonPreview = (data: any) => {
    const str = JSON.stringify(data, null, 2);
    return str.length > 200 ? str.substring(0, 200) + '...' : str;
  };

  return (
    <div className={`bg-white ${compact ? 'rounded-lg' : 'rounded-xl shadow-sm'} border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200`}>
      {/* Header */}
      <div className={`${compact ? 'p-4' : 'p-6'} border-b border-slate-100`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {showUrl && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-blue-600 hover:text-blue-800 font-medium ${compact ? 'text-xs' : 'text-sm'} flex items-center space-x-1 group mb-4`}
              >
                {getSnippetIcon(item.type, undefined, "w-4 h-4 text-blue-600 flex-shrink-0")}
                <span className="truncate">{item.url}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </a>
            )}
            <div className="flex items-center space-x-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formatBadgeColor(item.format)}`}>
                {item.format}
              </span>
              {item.type && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                  {item.type}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Show ID if available */}
        {item.id && (
          <div className="mb-3">
            <span className="text-xs font-medium text-slate-600">ID: </span>
            <code className="text-xs font-mono bg-slate-100 px-1 rounded">{item.id}</code>
          </div>
        )}

        {/* Quick Preview */}
        <div className={`bg-slate-50 rounded-lg ${compact ? 'p-2' : 'p-3'}`}>
          <pre className={`${compact ? 'text-xs' : 'text-xs'} text-slate-700 font-mono overflow-hidden`}>
            {formatJsonPreview(item.data)}
          </pre>
        </div>
      </div>

      {/* Expandable Content */}
      <div className={`${compact ? 'p-4' : 'p-6'} pt-0`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {isExpanded ? 'Hide' : 'Show'} Full Data
            </span>
          </button>

          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4">
            <div className="bg-slate-900 rounded-lg p-4 overflow-auto">
              <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                {JSON.stringify(item.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Connections */}
      {connections.length > 0 && (
        <div className={`px-6 py-4 bg-slate-50 border-t border-slate-100`}>
          <button
            onClick={() => setShowConnections(!showConnections)}
            className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            {showConnections ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <GitBranch className="w-4 h-4" />
            <span>Connections ({connections.length})</span>
          </button>

          {showConnections && (
            <div className="mt-3 space-y-2">
              {connections.map((connection, index) => (
                <a
                  href={`#snippet-${connection.targetHash}`}
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${connectionTypeColor(connection.type)} hover:bg-blue-50 hover:text-slate-900 hover:border-blue-300 transition-colors`}
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
        <div className={`px-6 py-4 bg-blue-50 border-t border-slate-100`}>
          <button
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
                    href={`#snippet-${relatedSnippet.hash}`}
                    key={relatedSnippet.hash}
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