'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/app';
import { getPipelines, createPipeline, updatePipelineStages } from '@/components/deals/api';
import type { Pipeline, PipelineStage } from '@/components/deals/types';

const STAGE_COLORS = [
  '#6366f1', '#F5A623', '#3b82f6', '#8b5cf6', '#22c55e',
  '#ec4899', '#14b8a6', '#f97316', '#ef4444', '#84cc16',
];

// ---- Sortable Stage Row ----

interface StageRowProps {
  stage: LocalStage;
  onUpdate: (id: string, field: 'name' | 'color', value: string) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

interface LocalStage {
  _key: string;
  id?: string;
  name: string;
  color: string;
  order: number;
}

function SortableStageRow({ stage, onUpdate, onDelete, canDelete }: StageRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage._key,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 busala-card p-3 rounded-xl"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-busala-text-subtle cursor-grab active:cursor-grabbing shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Color picker */}
      <div className="flex gap-1.5 shrink-0">
        {STAGE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onUpdate(stage._key, 'color', c)}
            className={`h-4 w-4 rounded-full transition-transform ${
              stage.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-card scale-110' : 'hover:scale-110'
            }`}
            style={{ backgroundColor: c }}
            aria-label={c}
          />
        ))}
      </div>

      <Input
        value={stage.name}
        onChange={(e) => onUpdate(stage._key, 'name', e.target.value)}
        className="bg-busala-hover-bg border-border flex-1 h-8 text-sm"
        placeholder="Stage name"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-busala-text-subtle hover:text-red-400 hover:bg-red-500/10 shrink-0"
        onClick={() => onDelete(stage._key)}
        disabled={!canDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ---- Settings Page ----

export default function PipelineSettingsPage() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const [stages, setStages] = useState<LocalStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activePipeline = pipelines.find((p) => p.id === activePipelineId);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await getPipelines();
        setPipelines(res.data);
        const def = res.data.find((p) => p.isDefault) || res.data[0];
        if (def) {
          setActivePipelineId(def.id);
          loadStages(def);
        }
      } catch {
        toast.error('Failed to load pipelines');
      }
      setIsLoading(false);
    })();
  }, []);

  const loadStages = (pipeline: Pipeline) => {
    setStages(
      pipeline.stages.map((s, i) => ({
        _key: s.id,
        id: s.id,
        name: s.name,
        color: s.color,
        order: i,
      }))
    );
  };

  const handlePipelineSwitch = (pipeline: Pipeline) => {
    setActivePipelineId(pipeline.id);
    loadStages(pipeline);
  };

  const handleUpdateStage = (key: string, field: 'name' | 'color', value: string) => {
    setStages((prev) => prev.map((s) => (s._key === key ? { ...s, [field]: value } : s)));
  };

  const handleDeleteStage = (key: string) => {
    setStages((prev) => prev.filter((s) => s._key !== key));
  };

  const handleAddStage = () => {
    const newKey = `new_${Date.now()}`;
    setStages((prev) => [
      ...prev,
      { _key: newKey, name: '', color: STAGE_COLORS[prev.length % STAGE_COLORS.length], order: prev.length },
    ]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stages.findIndex((s) => s._key === active.id);
    const newIndex = stages.findIndex((s) => s._key === over.id);
    setStages((prev) => arrayMove(prev, oldIndex, newIndex).map((s, i) => ({ ...s, order: i })));
  };

  const handleSave = async () => {
    if (!activePipelineId) return;
    const invalid = stages.some((s) => !s.name.trim());
    if (invalid) { toast.error('All stages must have a name'); return; }

    setIsSaving(true);
    try {
      const payload = stages.map((s, i) => ({
        ...(s.id ? { id: s.id } : {}),
        name: s.name.trim(),
        color: s.color,
        order: i,
      }));
      const res = await updatePipelineStages(activePipelineId, payload);
      // Refresh
      const pipelinesRes = await getPipelines();
      setPipelines(pipelinesRes.data);
      const updated = pipelinesRes.data.find((p) => p.id === activePipelineId);
      if (updated) loadStages(updated);
      toast.success('Pipeline stages saved');
    } catch {
      toast.error('Failed to save stages');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) return;
    setIsCreatingPipeline(true);
    try {
      const pipeline = await createPipeline({
        name: newPipelineName.trim(),
        stages: [
          { name: 'Lead', color: '#6366f1', order: 0 },
          { name: 'Closed Won', color: '#22c55e', order: 1 },
        ],
      });
      const res = await getPipelines();
      setPipelines(res.data);
      handlePipelineSwitch(pipeline);
      setNewPipelineName('');
      toast.success('Pipeline created');
    } catch {
      toast.error('Failed to create pipeline');
    } finally {
      setIsCreatingPipeline(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Pipeline Settings"
        subtitle="Configure stages for your sales pipelines"
      >
        <Button
          variant="ghost"
          size="sm"
          className="text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg gap-1.5 h-9"
          onClick={() => router.push('/deals')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 busala-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Pipeline selector + create */}
          <div className="busala-card p-4 rounded-2xl space-y-3">
            <Label className="text-sm text-busala-text-muted">Select Pipeline</Label>
            <div className="flex flex-wrap gap-2">
              {pipelines.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePipelineSwitch(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activePipelineId === p.id
                      ? 'bg-busala-gold text-[#0B0D10]'
                      : 'text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Input
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                placeholder="New pipeline name…"
                className="bg-busala-hover-bg border-border h-8 text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePipeline(); }}
              />
              <Button
                size="sm"
                variant="outline"
                className="border-border h-8"
                onClick={handleCreatePipeline}
                disabled={isCreatingPipeline || !newPipelineName.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Button>
            </div>
          </div>

          {/* Stages editor */}
          {activePipeline && (
            <div className="busala-card p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-busala-text-primary">{activePipeline.name}</h2>
                  <p className="text-xs text-busala-text-subtle mt-0.5">
                    Drag to reorder stages. Changes are saved when you click Save.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="busala-gradient-gold text-[#0B0D10] font-semibold h-8 gap-1.5"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stages.map((s) => s._key)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {stages.map((stage) => (
                      <SortableStageRow
                        key={stage._key}
                        stage={stage}
                        onUpdate={handleUpdateStage}
                        onDelete={handleDeleteStage}
                        canDelete={stages.length > 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <Button
                variant="ghost"
                size="sm"
                className="text-busala-text-subtle hover:text-busala-gold hover:bg-busala-hover-bg gap-1.5 h-8 text-xs"
                onClick={handleAddStage}
              >
                <Plus className="h-3.5 w-3.5" />
                Add stage
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
