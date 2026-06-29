'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, StatCard } from '../../../components/ReportCharts';

export default function ClientReportPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetching client report data
    const fetchReport = async () => {
      try {
        const res = await fetch('/api/v1/analytics/client-report?startDate=2026-06-01&endDate=2026-06-30', {
          headers: {
            'x-workspace-id': 'workspace-1'
          }
        });
        const data = await res.json();
        setReportData(data);
      } catch (err) {
        console.error('Failed to load report', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!reportData) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-red-500">Failed to load report data.</div>;
  }

  const { branding, metrics, dateRange } = reportData;

  // Prepare chart data
  const platforms = Object.keys(metrics.byPlatform);
  const viewsData = platforms.map(p => ({
    label: p,
    value: metrics.byPlatform[p].views
  }));
  const clicksData = platforms.map(p => ({
    label: p,
    value: metrics.byPlatform[p].clicks
  }));

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* White-Label Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10" style={{ borderBottomColor: branding.primaryColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            {/* Agency Logo */}
            <div 
              className="w-10 h-10 rounded mr-3 flex items-center justify-center font-bold text-white text-xl"
              style={{ backgroundColor: branding.primaryColor }}
            >
              {branding.agencyName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{branding.agencyName}</h1>
              <p className="text-xs text-gray-500">Client Performance Report</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Top-Level KPIs */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Total Impressions" 
              value={metrics.totalViews.toLocaleString()} 
              color={branding.primaryColor}
            />
            <StatCard 
              title="Total Clicks" 
              value={metrics.totalClicks.toLocaleString()} 
              color={branding.primaryColor}
            />
            <StatCard 
              title="Total Shares" 
              value={metrics.totalShares.toLocaleString()} 
              color={branding.primaryColor}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-6">Impressions by Platform</h3>
            <BarChart data={viewsData} primaryColor={branding.primaryColor} />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-6">Clicks by Platform</h3>
            <BarChart data={clicksData} primaryColor={branding.primaryColor} />
          </div>
        </div>
        
      </main>
    </div>
  );
}
