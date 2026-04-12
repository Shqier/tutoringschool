'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Clock, BarChart2 } from 'lucide-react';
import { getPipelineAnalytics } from './api';
import type { PipelineAnalytics as PipelineAnalyticsType } from './types';

interface PipelineAnalyticsProps {
  pipelineId: string;
}

export function PipelineAnalytics({ pipelineId }: PipelineAnalyticsProps) {
  const [data, setData] = useState<PipelineAnalyticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pipelineId) return;
    setIsLoading(true);
    setError(null);
    getPipelineAnalytics(pipelineId)
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load analytics'))
      .finally(() => setIsLoading(false));
  }, [pipelineId]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-busala-text-primary">
          <BarChart2 className="h-4 w-4 text-busala-gold" />
          Pipeline Analytics
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="busala-card p-4 rounded-2xl animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null; // Silent fail — analytics is secondary
  }

  const winRatePercent = data.winRate * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-busala-text-primary">
        <BarChart2 className="h-4 w-4 text-busala-gold" />
        Pipeline Analytics
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Win Rate */}
        <div className="busala-card p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-busala-text-muted font-medium uppercase tracking-wide">Win Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-busala-text-primary">{formatPercent(data.winRate)}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-busala-text-subtle">
              <span>0%</span>
              <span>100%</span>
            </div>
            <div className="h-1.5 bg-busala-hover-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min(winRatePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Avg Deal Size */}
        <div className="busala-card p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-busala-text-muted font-medium uppercase tracking-wide">Avg Deal Size</span>
            <DollarSign className="h-4 w-4 text-busala-gold" />
          </div>
          <p className="text-2xl font-bold text-busala-text-primary">{formatCurrency(data.avgDealSize)}</p>
          <p className="text-xs text-busala-text-subtle">
            {data.totalDeals} deal{data.totalDeals !== 1 ? 's' : ''} · {formatCurrency(data.totalValue)} total
          </p>
        </div>

        {/* Avg Time in Stage */}
        <div className="busala-card p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-busala-text-muted font-medium uppercase tracking-wide">Avg Time in Stage</span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <div className="space-y-1.5 max-h-28 overflow-y-auto">
            {data.byStage.length === 0 && (
              <p className="text-xs text-busala-text-subtle">No stage data yet</p>
            )}
            {data.byStage.map((stage) => (
              <div key={stage.stageId} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-xs text-busala-text-muted truncate">{stage.stageName}</span>
                </div>
                <span className="text-xs text-busala-text-primary font-medium shrink-0">
                  {stage.avgTimeInStage < 1
                    ? `${Math.round(stage.avgTimeInStage * 24)}h`
                    : `${stage.avgTimeInStage.toFixed(1)}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stage breakdown bar */}
      {data.byStage.some((s) => s.dealCount > 0) && (
        <div className="busala-card p-4 rounded-2xl space-y-3">
          <span className="text-xs text-busala-text-muted font-medium uppercase tracking-wide">Deals by Stage</span>
          <div className="space-y-2">
            {data.byStage
              .filter((s) => s.dealCount > 0)
              .map((stage) => {
                const pct = data.totalDeals > 0 ? (stage.dealCount / data.totalDeals) * 100 : 0;
                return (
                  <div key={stage.stageId} className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-28 shrink-0">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                      <span className="text-xs text-busala-text-muted truncate">{stage.stageName}</span>
                    </div>
                    <div className="flex-1 h-1.5 bg-busala-hover-bg rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: stage.color }}
                      />
                    </div>
                    <span className="text-xs text-busala-text-subtle w-8 text-right shrink-0">
                      {stage.dealCount}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
