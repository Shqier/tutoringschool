'use client';

import React from 'react';

export interface SimpleBarChartProps<T> {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  color?: string;
  height?: number;
  barRadius?: number;
  className?: string;
}

export function SimpleBarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  color = 'var(--busala-gold)',
  height = 200,
  barRadius = 4,
  className = '',
}: SimpleBarChartProps<T>) {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center text-busala-text-muted text-sm ${className}`} style={{ height }}>
        No data
      </div>
    );
  }

  const values = data.map((d) => Number(d[yKey]));
  const maxVal = Math.max(...values, 1);
  const padding = { top: 8, right: 8, bottom: 24, left: 40 };
  const chartWidth = 320;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = Math.max(8, (chartWidth - padding.left - padding.right) / data.length - 8);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${chartWidth + padding.left + padding.right} ${height}`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {values.map((val, i) => {
        const barHeight = (val / maxVal) * chartHeight;
        const x = padding.left + i * (barWidth + 8);
        const y = padding.top + chartHeight - barHeight;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={barRadius}
              ry={barRadius}
              fill={color}
              className="opacity-90 hover:opacity-100 transition-opacity"
            />
            <text
              x={x + barWidth / 2}
              y={height - 6}
              textAnchor="middle"
              className="fill-busala-text-muted text-[10px]"
            >
              {String(data[i][xKey])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
