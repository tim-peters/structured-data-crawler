import React, { useState } from 'react';
import { StructuredDataItem } from '../types/crawler';
import { groupStructuredData, findRelatedSnippets } from '../services/dataGrouper';
import { getSnippetIcon } from '../utils/iconUtils';
import { useViewMode } from '../contexts/ViewModeContext';
import { ExternalLink, ChevronDown, ChevronRight, Copy, Check, Link, GitBranch } from 'lucide-react';

interface StructuredDataCardProps {
  item: StructuredDataItem;
  allData?: StructuredDataItem[];
  compact?: boolean;
  showUrl?: boolean;
  currentFormatFilter?: string;
}

export function StructuredDataCard({ item, allData = [], compact = false, showUrl = false, currentFormatFilter = 'all'  }: StructuredDataCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { setViewMode } = useViewMode();

  // Generate snippet data to find connections and related snippets
  const snippetData = allData.length > 0 ? groupStructuredData(allData) : [];
  const currentSnippet = snippetData.find(snippet => snippet.hash === item.hash);
  const connections = currentSnippet?.connections || [];
  
  const relatedSnippets = currentSnippet ? findRelatedSnippets(currentSnippet, snippetData) : [];

  const handleConnectionClick = (targetHash: string) => {
    // Switch to snippet view
    setViewMode('bySnippet');
    
    // Scroll to the target snippet after a short delay to allow view change
    setTimeout(() => {
      const targetElement = document.getElementById(`snippet-${targetHash}`);
      console.dir(targetElement);
      if (targetElement) {
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Add a highlight effect
        targetElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
        setTimeout(() => {
          targetElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
        }, 3000);
      }
    }, 100);
  };

  const formatBadgeColor = (format: string) => {
    const colors = {
      'JSON-LD': 'bg-blue-100 text-blue-800',
      'Microdata': 'bg-green-100 text-green-800',
      'RDFa': 'bg-purple-100 text-purple-800',
      'OpenGraph': 'bg-orange-100 text-orange-800',
      'Twitter Cards': 'bg-cyan-100 text-cyan-800',
      'Schema.org': 'bg-indigo-100 text-indigo-800'
    };
    return colors[format as keyof typeof colors] || 'bg-slate-100 text-slate-800';
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

        {/* Connections Summary */}
        {connections.length > 0 && (
          <div className="flex items-center space-x-4 text-sm mb-3">
            <a
              href={`#connections-${item.hash}`}
              onClick={() => handleConnectionClick(item.hash)}
              className="flex items-center space-x-2 text-slate-600 hover:text-blue-700 cursor-pointer"
            >
              <Link className="w-4 h-4" />
              <span>{connections.length} connection{connections.length !== 1 ? 's' : ''}</span>
            </a>
            {relatedSnippets.length > 0 && (
              <a
                href={`#related-groups-${item.hash}`}
                onClick={() => handleConnectionClick(item.hash)}
                className="flex items-center space-x-2 text-slate-600 hover:text-blue-700 cursor-pointer"
              >
                <GitBranch className="w-4 h-4" />
                <span>{relatedSnippets.length} related group{relatedSnippets.length !== 1 ? 's' : ''}</span>
              </a>
            )}
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
    </div>
  );
}