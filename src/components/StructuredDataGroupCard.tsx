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
  currentFormatFilter?: string;
}

export function StructuredDataGroupCard({ group, allGroups, currentFormatFilter = 'all' }: StructuredDataGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showAllUrls, setShowAllUrls] = useState(false);
  const [showRelatedGroups, setShowRelatedGroups] = useState(false);

  const allRelatedGroups = findRelatedGroups(group, allGroups);
  const relatedGroups = currentFormatFilter === 'all' 
    ? allRelatedGroups 
    : allRelatedGroups.filter(relatedGroup => relatedGroup.format === currentFormatFilter);
  const uniqueUrls = [...new Set(group.items.map(item => item.url))];

  // Helper function to extract descriptive name from structured data
  const getDescriptiveName = (group: StructuredDataGroup): string => {
    if (!group.items || group.items.length === 0) return '';
    
    const data = group.items[0].data;
    
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

  return (
    <div 
      id={`group-${group.hash}`}
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      {/* Group Header */}
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg">
                <Database className="w-5 h-5 text-slate-600" />
              </div>
              {/* Add descriptiveName as a title */}
              {getDescriptiveName(group) && (
                <p className="text-lg font-medium text-slate-900 mb-2">
                  {getDescriptiveName(group).length > 60
                    ? `${getDescriptiveName(group).substring(0, 60)}...`
                    : getDescriptiveName(group)}
                </p>
              )}
              {/*<div>
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
              </div>*/}
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

      {/* Group Items */}
      <div className="p-6">
        <div className="space-y-4">
          {group.items.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <StructuredDataCard item={group.items[0]} compact />
            </div>
          )}
        </div>
      </div>

      {/* Connections */}
      {group.connections.length > 0 && (
        <div id={`connections-${group.hash}`} className="px-6 py-4 bg-slate-50 border-b border-slate-100">
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

      {/* Related Groups */}
      {relatedGroups.length > 0 && (
        <div id={`related-groups-${group.hash}`} className="px-6 py-4 bg-blue-50 border-t border-slate-100">
          <button
            onClick={() => setShowRelatedGroups(!showRelatedGroups)}
            className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors mb-3"
          >
            {showRelatedGroups ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <Link className="w-4 h-4" />
            <span>Related Snippets ({relatedGroups.length})</span>
          </button>
          {showRelatedGroups && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedGroups.map((relatedGroup) => {
                const descriptiveName = getDescriptiveName(relatedGroup);
                return (
                  <a
                    href={`#group-${relatedGroup.hash}`}
                    key={relatedGroup.hash}
                    className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${formatBadgeColor(relatedGroup.format)}`}>
                          {relatedGroup.format}
                        </span>
                      </div>
                      {descriptiveName && (
                        <p className="text-sm font-medium text-slate-800 mb-1 line-clamp-2">
                          {descriptiveName.length > 60 ? `${descriptiveName.substring(0, 60)}...` : descriptiveName}
                        </p>
                      )}
                      <Link className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      {relatedGroup.type}
                    </p>
                    {relatedGroup.duplicateCount > 1 && (
                      <p className="text-xs text-amber-600 mt-1">
                        {relatedGroup.duplicateCount} duplicates
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