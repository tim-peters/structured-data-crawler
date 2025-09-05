import React, { useState } from 'react';
import { StructuredDataGroup, StructuredDataItem } from '../types/crawler';
import { StructuredDataCard } from './StructuredDataCard';
import { findRelatedGroups } from '../services/dataGrouper';
import { 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check, 
  Link, 
  Globe, 
  Database,
  GitBranch,
  Users
} from 'lucide-react';

interface StructuredDataGroupCardProps {
  group: StructuredDataGroup;
  allGroups: StructuredDataGroup[];
}

export function StructuredDataGroupCard({ group, allGroups }: StructuredDataGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [copied, setCopied] = useState(false);

  const relatedGroups = findRelatedGroups(group, allGroups);
  const uniqueUrls = [...new Set(group.items.map(item => item.url))];

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
      const exportData = {
        group: {
          hash: group.hash,
          type: group.type,
          format: group.format,
          duplicateCount: group.duplicateCount,
          connections: group.connections
        },
        items: group.items,
        relatedGroups: relatedGroups.map(g => ({
          hash: g.hash,
          type: g.type,
          duplicateCount: g.duplicateCount
        }))
      };
      
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Group Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg">
                <Database className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formatBadgeColor(group.format)}`}>
                    {group.format}
                  </span>
                  {group.type && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {group.type}
                    </span>
                  )}
                  {group.duplicateCount > 1 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <Users className="w-3 h-3 mr-1" />
                      {group.duplicateCount} duplicates
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  Hash: <code className="font-mono text-xs bg-slate-100 px-1 rounded">{group.hash}</code>
                </p>
              </div>
            </div>

            {/* URLs */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Found on {uniqueUrls.length} page{uniqueUrls.length !== 1 ? 's' : ''}:</p>
              <div className="flex flex-wrap gap-2">
                {uniqueUrls.slice(0, 3).map((url, index) => (
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
                {uniqueUrls.length > 3 && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    +{uniqueUrls.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>

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
                <span>Copy Group</span>
              </>
            )}
          </button>
        </div>

        {/* Connections Summary */}
        {group.connections.length > 0 && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2 text-slate-600">
              <Link className="w-4 h-4" />
              <span>{group.connections.length} connection{group.connections.length !== 1 ? 's' : ''}</span>
            </div>
            {relatedGroups.length > 0 && (
              <div className="flex items-center space-x-2 text-slate-600">
                <GitBranch className="w-4 h-4" />
                <span>{relatedGroups.length} related group{relatedGroups.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connections */}
      {group.connections.length > 0 && (
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <button
            onClick={() => setShowConnections(!showConnections)}
            className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            {showConnections ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span>Connections ({group.connections.length})</span>
          </button>

          {showConnections && (
            <div className="mt-3 space-y-2">
              {group.connections.map((connection, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${connectionTypeColor(connection.type)}`}
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Group Items */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-900">
            Group Items ({group.items.length})
          </h4>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span>{isExpanded ? 'Hide' : 'Show'} Details</span>
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {group.items.map((item, index) => (
              <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
                <StructuredDataCard item={item} compact />
              </div>
            ))}
          </div>
        )}

        {!isExpanded && (
          <div className="bg-slate-50 rounded-lg p-3">
            <pre className="text-xs text-slate-700 font-mono overflow-hidden">
              {JSON.stringify(group.items[0].data, null, 2).substring(0, 300)}
              {JSON.stringify(group.items[0].data, null, 2).length > 300 && '...'}
            </pre>
          </div>
        )}
      </div>

      {/* Related Groups */}
      {relatedGroups.length > 0 && (
        <div className="px-6 py-4 bg-blue-50 border-t border-slate-100">
          <h5 className="text-sm font-semibold text-slate-900 mb-3">
            Related Groups ({relatedGroups.length})
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedGroups.map((relatedGroup) => (
              <div
                key={relatedGroup.hash}
                className="bg-white rounded-lg p-3 border border-blue-200"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formatBadgeColor(relatedGroup.format)}`}>
                    {relatedGroup.format}
                  </span>
                  {relatedGroup.type && (
                    <span className="text-xs text-slate-600">{relatedGroup.type}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Hash: {relatedGroup.hash}
                </p>
                {relatedGroup.duplicateCount > 1 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {relatedGroup.duplicateCount} duplicates
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}