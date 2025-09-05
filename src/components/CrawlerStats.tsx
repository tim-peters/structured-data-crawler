import React from 'react';
import { CrawlStats } from '../types/crawler';
import { Clock, Globe, Database, Activity } from 'lucide-react';

interface CrawlerStatsProps {
  stats: CrawlStats;
}

export function CrawlerStats({ stats }: CrawlerStatsProps) {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const statCards = [
    {
      label: 'Pages Crawled',
      value: stats.pagesCrawled.toLocaleString(),
      icon: Globe,
      color: 'blue'
    },
    {
      label: 'Structured Data Found',
      value: stats.structuredDataFound.toLocaleString(),
      icon: Database,
      color: 'green'
    },
    {
      label: 'Crawl Duration',
      value: formatDuration(stats.duration),
      icon: Clock,
      color: 'purple'
    },
    {
      label: 'Status',
      value: stats.status,
      icon: Activity,
      color: stats.status === 'running' ? 'orange' : stats.status === 'completed' ? 'green' : 'red'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Crawl Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      {stats.status === 'running' && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <span>Crawling in progress...</span>
            <span>{stats.pagesCrawled} pages processed</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 animate-pulse"
              style={{ width: '100%' }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}