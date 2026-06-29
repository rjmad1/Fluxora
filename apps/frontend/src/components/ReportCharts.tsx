'use client';

import React from 'react';

interface ChartProps {
  data: {
    label: string;
    value: number;
    color?: string;
  }[];
  primaryColor?: string;
}

export function BarChart({ data, primaryColor = '#2563eb' }: ChartProps) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end h-64 gap-4 p-4 border-l-2 border-b-2 border-gray-200">
      {data.map((item, idx) => (
        <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group">
          <div 
            className="w-full rounded-t-sm transition-all duration-500 ease-out relative flex justify-center"
            style={{ 
              height: `${(item.value / maxVal) * 100}%`,
              backgroundColor: item.color || primaryColor,
              minHeight: '2px'
            }}
          >
            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity">
              {item.value.toLocaleString()}
            </div>
          </div>
          <div className="mt-2 text-xs font-medium text-gray-600 truncate w-full text-center capitalize">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCard({ title, value, subtitle, color = '#2563eb' }: { title: string, value: string | number, subtitle?: string, color?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }}></div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
    </div>
  );
}
