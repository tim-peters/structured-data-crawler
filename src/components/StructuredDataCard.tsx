import React, { useState } from 'react';
import { StructuredDataItem } from '../types/crawler';
import { groupStructuredData, findIncomingReferences } from '../services/dataGrouper';
import { getSnippetIcon } from '../utils/iconUtils';
import { useViewMode } from '../contexts/ViewModeContext';
import { ExternalLink, ChevronDown, ChevronRight, Copy, Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface StructuredDataCardProps {
  item: StructuredDataItem;
  allData?: StructuredDataItem[];
  compact?: boolean;
  showUrl?: boolean;
}

export function StructuredDataCard({ 
  item, 
  allData = [], 
  compact = false, 
  showUrl = false 
}: StructuredDataCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOutgoingReferences, setShowOutgoingReferences] = useState(false);
  const [showIncomingReferences, setShowIncomingReferences] = useState(false);
  const { setViewMode } = useViewMode();

  // Generate snippet data to find connections and related snippets
  const snippetData = allData.length > 0 ? groupStructuredData(allData) : [];
  const currentSnippet = snippetData.find(snippet => snippet.hash === item.hash);
  const outgoingConnections = currentSnippet?.connections || [];
  
  // Find snippets that this item references (outgoing)
  const outgoingSnippets = snippetData.filter(snippet => 
    outgoingConnections.some(conn => conn.targetHash === snippet.hash)
  );
  
  // Find snippets that reference this item (incoming)
  const incomingSnippets = currentSnippet ? findIncomingReferences(currentSnippet, snippetData) : [];

  const handleConnectionClick = (targetHash: string) => {
    setViewMode('bySnippet');

    setTimeout(() => {
      // Finde das Ziel-Element
      const targetSnippet = document.getElementById(`snippet-${targetHash}`);
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
    }, 100);
  };

  // Helper function to extract descriptive name from structured data  
  const getDescriptiveName = (snippet: any): string => {
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
    <div className={`dataCard bg-white ${compact ? 'rounded-lg' : 'rounded-xl shadow-sm'} border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200`}>
      {/* Header */}
      <div className={`${compact ? 'p-4' : 'p-6'} pb-2`}>
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

      {/* Outgoing References */}
      {outgoingSnippets.length > 0 && (
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <button
            onClick={() => setShowOutgoingReferences(!showOutgoingReferences)}
            className="flex items-center w-full justify-between text-slate-700 hover:text-slate-900 transition-colors mb-3"
          >
            <div className="flex items-center space-x-2 text-sm font-medium">
              <ArrowRight className="w-4 h-4" />
              <span>References ({outgoingSnippets.length})</span>
            </div>
            {showOutgoingReferences ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {showOutgoingReferences && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <div className="p-4 bg-blue-50 border-t border-slate-100">
          <button
            onClick={() => setShowIncomingReferences(!showIncomingReferences)}
            className="flex items-center w-full justify-between text-slate-700 hover:text-slate-900 transition-colors mb-3"
          >
            <div className="flex items-center space-x-2 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" />
              <span>Referenced By ({incomingSnippets.length})</span>
            </div>
            {showIncomingReferences ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
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