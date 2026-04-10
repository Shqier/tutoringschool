'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DealCard } from './DealCard';
import { updateDeal } from './api';
import type { Deal, Pipeline, PipelineStage } from './types';

// ---- Stage Column ----

interface StageColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onAddDeal: (stageId: string) => void;
  onDealClick: (deal: Deal) => void;
}

function StageColumn({ stage, deals, onAddDeal, onDealClick }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const totalValue = deals.reduce((acc, d) => acc + (d.value || 0), 0);

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm font-semibold text-busala-text-primary">{stage.name}</span>
          <span className="text-xs text-busala-text-subtle bg-busala-hover-bg px-1.5 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-xs text-busala-text-muted font-medium">
            ${totalValue.toLocaleString()}
          </span>
        )}
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[120px] rounded-xl p-2 space-y-2 transition-colors ${
          isOver ? 'bg-busala-gold/10 ring-1 ring-busala-gold/30' : 'bg-busala-hover-bg/40'
        }`}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onClick={onDealClick} />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-busala-text-subtle select-none">
            Drop cards here
          </div>
        )}
      </div>

      {/* Add Deal button */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full text-busala-text-subtle hover:text-busala-gold hover:bg-busala-hover-bg justify-start gap-1.5 h-8 text-xs"
        onClick={() => onAddDeal(stage.id)}
      >
        <Plus className="h-3.5 w-3.5" />
        Add deal
      </Button>
    </div>
  );
}

// ---- Kanban Board ----

interface KanbanBoardProps {
  pipeline: Pipeline;
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onAddDeal: (stageId: string) => void;
  onDealsChange: (deals: Deal[]) => void;
}

export function KanbanBoard({
  pipeline,
  deals,
  onDealClick,
  onAddDeal,
  onDealsChange,
}: KanbanBoardProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [localDeals, setLocalDeals] = useState<Deal[]>(deals);

  // Sync when parent updates
  React.useEffect(() => {
    setLocalDeals(deals);
  }, [deals]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getDealsByStage = useCallback(
    (stageId: string) => localDeals.filter((d) => d.stageId === stageId),
    [localDeals]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const deal = localDeals.find((d) => d.id === event.active.id);
    setActiveDeal(deal || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeDealItem = localDeals.find((d) => d.id === activeId);
    if (!activeDealItem) return;

    // Check if over is a stage (droppable) or a deal (sortable)
    const overIsStage = pipeline.stages.some((s) => s.id === overId);
    const targetStageId = overIsStage
      ? overId
      : localDeals.find((d) => d.id === overId)?.stageId;

    if (!targetStageId || targetStageId === activeDealItem.stageId) return;

    setLocalDeals((prev) =>
      prev.map((d) => (d.id === activeId ? { ...d, stageId: targetStageId } : d))
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeDealItem = deals.find((d) => d.id === activeId); // original
    if (!activeDealItem) return;

    const overIsStage = pipeline.stages.some((s) => s.id === overId);
    const targetStageId = overIsStage
      ? overId
      : localDeals.find((d) => d.id === overId)?.stageId;

    if (!targetStageId || targetStageId === activeDealItem.stageId) return;

    // Optimistic already applied; now persist
    try {
      const updated = await updateDeal(activeId, { stageId: targetStageId });
      setLocalDeals((prev) =>
        prev.map((d) => (d.id === activeId ? { ...d, ...updated } : d))
      );
      onDealsChange(
        localDeals.map((d) => (d.id === activeId ? { ...d, ...updated } : d))
      );
    } catch {
      // Revert on failure
      toast.error('Failed to move deal');
      setLocalDeals(deals);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
        {pipeline.stages.map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            deals={getDealsByStage(stage.id)}
            onAddDeal={onAddDeal}
            onDealClick={onDealClick}
          />
        ))}

        {pipeline.stages.length === 0 && (
          <div className="flex items-center justify-center w-full text-busala-text-subtle text-sm">
            No stages configured. Go to Pipeline Settings to add stages.
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDeal && <DealCard deal={activeDeal} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
