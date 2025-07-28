'use client'

import React from 'react';

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  width = 80,
  height = 24,
  color = '#10b981', // emerald-500
  className = '',
}) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className={`inline-block ${className}`}
        style={{ width, height }}
      >
        <div className="w-full h-full bg-slate-100 rounded opacity-50" />
      </div>
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  if (range === 0) {
    // All values are the same - show flat line
    return (
      <div 
        className={`inline-block ${className}`}
        style={{ width, height }}
      >
        <svg width={width} height={height} className="overflow-visible">
          <line
            x1={0}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  // Create path for sparkline
  const stepX = width / (data.length - 1);
  const points = data.map((value, index) => {
    const x = index * stepX;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // Create area path for gradient fill
  const areaPoints = [
    `0,${height}`, // Start at bottom left
    ...data.map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }),
    `${width},${height}` // End at bottom right
  ].join(' ');

  return (
    <div 
      className={`inline-block ${className}`}
      style={{ width, height }}
    >
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${Date.now()}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <polygon
          points={areaPoints}
          fill={`url(#gradient-${Date.now()})`}
          stroke="none"
        />
        
        {/* Line */}
        <polyline
          points={points}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Last point indicator */}
        {data.length > 0 && (
          <circle
            cx={(data.length - 1) * stepX}
            cy={height - ((data[data.length - 1] - min) / range) * height}
            r="2"
            fill={color}
            stroke="white"
            strokeWidth="1"
          />
        )}
      </svg>
    </div>
  );
};

// Sample data generator for demo purposes
export const generateSampleEmissionsData = (days: number = 30): number[] => {
  const data: number[] = [];
  const baseValue = 100;
  
  for (let i = 0; i < days; i++) {
    // Simulate some trend with random variation
    const trend = Math.sin(i / days * Math.PI) * 20;
    const noise = (Math.random() - 0.5) * 30;
    const value = Math.max(0, baseValue + trend + noise);
    data.push(Math.round(value * 100) / 100);
  }
  
  return data;
};
