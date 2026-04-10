'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/app';
import { KanbanBoard } from '@/components/deals/KanbanBoard';
import { DealDrawer } from '@/components/deals/DealDrawer';
import { getPipelines, getDeals, createPipeline } from '@/components/deals/api';
import type { Pipeline, Deal } from '@/components/deals/types';

const DEFAULT_STAGES = [
  { name: 'Lead', color: '#6366f1', order: 0 },
  { name: 'Qualified', color: '#F5A623', order: 1 },
  { name: 'Proposal', color: '#3b82f6', order: 2 },
  { name: 'Negotiation', color: '#8b5cf6', order: 3 },
  { name: 'Closed Won', color: '#22c55e', order: 4 },
];

export default function DealsPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [defaultStageId, setDefaultStageId] = useState<string | undefined>();

  const loadPipelines = useCallback(async () => {
    try {
      const res = await getPipelines();
      let list = res.data;

      if (list.length === 0) {
        // Bootstrap default pipeline
        const created = await createPipeline({
          name: 'Sales Pipeline',
          isDefault: true,
          stages: DEFAULT_STAGES,
        });
        list = [created];
        toast.success('Default pipeline created');
      }

      setPipelines(list);
      const def = list.find((p) => p.isDefault) || list[0];
      setActivePipeline(def);
    } catch {
      toast.error('Failed to load pipelines');
    }
  }, []);

  const loadDeals = useCallback(async (pipeline: Pipeline) => {
    try {
      const res = await getDeals(pipeline.id);
      setDeals(res.data);
    } catch {
      toast.error('Failed to load deals');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await loadPipelines();
      setIsLoading(false);
    })();
  }, [loadPipelines]);

  useEffect(() => {
    if (activePipeline) loadDeals(activePipeline);
  }, [activePipeline, loadDeals]);

  const handleAddDeal = (stageId: string) => {
    setSelectedDeal(null);
    setDefaultStageId(stageId);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleDrawerSuccess = () => {
    if (activePipeline) loadDeals(activePipeline);
  };

  const totalValue = deals.reduce((acc, d) => acc + (d.value || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Deals" subtitle="Loading pipeline…" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-72 shrink-0">
              <div className="h-6 w-32 bg-busala-hover-bg rounded animate-pulse mb-3" />
              <div className="bg-busala-hover-bg/40 rounded-xl p-2 min-h-[120px] space-y-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="h-20 bg-busala-hover-bg rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        subtitle={`${deals.length} deals · $${totalValue.toLocaleString()} pipeline value`}
        actionLabel="New Deal"
        actionIcon={Plus}
        onAction={() => handleAddDeal(activePipeline?.stages[0]?.id || '')}
      >
        <Link href="/deals/settings">
          <Button
            variant="ghost"
            size="sm"
            className="text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg h-9 gap-1.5"
          >
            <Settings className="h-4 w-4" />
            Pipeline Settings
          </Button>
        </Link>
      </PageHeader>

      {/* Pipeline tabs */}
      {pipelines.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePipeline(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activePipeline?.id === p.id
                  ? 'bg-busala-gold text-[#0B0D10]'
                  : 'text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {activePipeline ? (
        <KanbanBoard
          pipeline={activePipeline}
          deals={deals}
          onDealClick={handleDealClick}
          onAddDeal={handleAddDeal}
          onDealsChange={setDeals}
        />
      ) : (
        <div className="busala-card p-12 text-center space-y-4">
          <p className="text-busala-text-muted">No pipeline found.</p>
          <Button
            onClick={loadPipelines}
            className="busala-gradient-gold text-[#0B0D10] font-semibold"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {activePipeline && (
        <DealDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          mode={drawerMode}
          deal={selectedDeal}
          pipeline={activePipeline}
          defaultStageId={defaultStageId}
          onSuccess={handleDrawerSuccess}
        />
      )}
    </div>
  );
}
