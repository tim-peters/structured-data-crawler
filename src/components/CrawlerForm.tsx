import React, { useState } from 'react';
import { Play, Square, Globe, Settings } from 'lucide-react';

interface CrawlerFormProps {
  onStartCrawl: (domain: string, options: CrawlOptions) => void;
  onStopCrawl: () => void;
  isLoading: boolean;
}

export interface CrawlOptions {
  maxPages: number;
  maxDepth: number;
  respectRobots: boolean;
  delay: number;
}

export function CrawlerForm({ onStartCrawl, onStopCrawl, isLoading }: CrawlerFormProps) {
  const [domain, setDomain] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState<CrawlOptions>({
    maxPages: 50,
    maxDepth: 3,
    respectRobots: true,
    delay: 1000
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (domain.trim()) {
      onStartCrawl(domain.trim(), options);
    }
  };

  const formatDomain = (input: string) => {
    let formatted = input.toLowerCase().trim();
    if (formatted && !formatted.startsWith('http')) {
      formatted = `https://${formatted}`;
    }
    return formatted;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="domain" className="block text-sm font-semibold text-slate-700 mb-3">
          Target Domain
        </label>
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="domain"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com or https://example.com"
            className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            disabled={isLoading}
            required
          />
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Enter the domain you want to crawl for structured data
        </p>
      </div>

      {/* Advanced Options Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Advanced Options</span>
        </button>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="bg-slate-50 rounded-xl p-6 space-y-4">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Crawling Parameters</h4>
            <p className="text-xs text-slate-600">
              Configure how the crawler behaves when discovering structured data across your target domain.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Pages
              </label>
              <input
                type="number"
                value={options.maxPages}
                onChange={(e) => setOptions(prev => ({ ...prev, maxPages: parseInt(e.target.value) || 50 }))}
                min="1"
                max="1000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">Maximum number of pages to crawl</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Depth
              </label>
              <input
                type="number"
                value={options.maxDepth}
                onChange={(e) => setOptions(prev => ({ ...prev, maxDepth: parseInt(e.target.value) || 3 }))}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">How deep to follow links from the starting page</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Delay (ms)
              </label>
              <input
                type="number"
                value={options.delay}
                onChange={(e) => setOptions(prev => ({ ...prev, delay: parseInt(e.target.value) || 1000 }))}
                min="100"
                max="10000"
                step="100"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">Delay between requests to be respectful</p>
            </div>
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.respectRobots}
                  onChange={(e) => setOptions(prev => ({ ...prev, respectRobots: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  Respect robots.txt
                </span>
              </label>
              <p className="text-xs text-slate-500 mt-1 ml-6">Follow robots.txt crawling rules</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        {!isLoading ? (
          <button
            type="submit"
            disabled={!domain.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            <Play className="w-5 h-5" />
            <span>Start Crawling</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStopCrawl}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium"
          >
            <Square className="w-5 h-5" />
            <span>Stop Crawling</span>
          </button>
        )}
      </div>
    </form>
  );
}