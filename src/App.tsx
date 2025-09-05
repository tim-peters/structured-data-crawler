import React, { useState, useCallback } from 'react';
import { CrawlerForm } from './components/CrawlerForm';
import { CrawlerResults } from './components/CrawlerResults';
import { CrawlerStats } from './components/CrawlerStats';
import { useCrawler } from './hooks/useCrawler';
import { Globe, Database } from 'lucide-react';

function App() {
  const {
    crawlData,
    groupedData,
    isLoading,
    error,
    stats,
    startCrawl,
    stopCrawl
  } = useCrawler();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Structured Data Crawler
              </h1>
              <p className="text-slate-600">
                Discover and analyze structured data across websites
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Crawler Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <CrawlerForm
              onStartCrawl={startCrawl}
              onStopCrawl={stopCrawl}
              isLoading={isLoading}
            />
          </div>

          {/* Stats */}
          {stats && (
            <CrawlerStats stats={stats} />
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-red-800 font-medium">Crawling Error</p>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </div>
          )}

          {/* Results */}
          {groupedData.length > 0 && (
            <CrawlerResults data={crawlData} groupedData={groupedData} />
          )}

          {/* Empty State */}
          {!isLoading && crawlData.length === 0 && !error && (
            <div className="text-center py-16">
              <Globe className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Ready to Crawl
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Enter a domain above to start discovering structured data across web pages.
                The crawler will analyze JSON-LD, microdata, RDFa, and other structured formats.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;