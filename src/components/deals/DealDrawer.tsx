'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createDeal, updateDeal, deleteDeal } from './api';
import type { Deal, Pipeline } from './types';

const dealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  value: z.string().optional(),
  ownerName: z.string().optional(),
  stageId: z.string().min(1, 'Stage is required'),
  notes: z.string().optional(),
  expectedClose: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  deal?: Deal | null;
  pipeline: Pipeline;
  defaultStageId?: string;
  onSuccess?: () => void;
}

export function DealDrawer({
  open,
  onClose,
  mode,
  deal,
  pipeline,
  defaultStageId,
  onSuccess,
}: DealDrawerProps) {
  const isEdit = mode === 'edit' || (mode === 'view' && !!deal);
  const [currentMode, setCurrentMode] = React.useState(mode);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: '',
      value: '',
      ownerName: '',
      stageId: defaultStageId || pipeline.stages[0]?.id || '',
      notes: '',
      expectedClose: '',
    },
  });

  const stageId = watch('stageId');

  useEffect(() => {
    setCurrentMode(mode);
    if (deal) {
      reset({
        title: deal.title,
        value: deal.value != null ? String(deal.value) : '',
        ownerName: deal.ownerName || '',
        stageId: deal.stageId,
        notes: deal.notes || '',
        expectedClose: deal.expectedClose ? deal.expectedClose.split('T')[0] : '',
      });
    } else {
      reset({
        title: '',
        value: '',
        ownerName: '',
        stageId: defaultStageId || pipeline.stages[0]?.id || '',
        notes: '',
        expectedClose: '',
      });
    }
  }, [deal, mode, open, defaultStageId, pipeline.stages, reset]);

  const onSubmit = async (values: DealFormValues) => {
    try {
      const payload = {
        title: values.title,
        value: values.value ? parseFloat(values.value) : undefined,
        ownerName: values.ownerName || undefined,
        stageId: values.stageId,
        notes: values.notes || undefined,
        expectedClose: values.expectedClose || undefined,
      };

      if (deal) {
        await updateDeal(deal.id, payload);
        toast.success('Deal updated');
      } else {
        await createDeal({ ...payload, pipelineId: pipeline.id });
        toast.success('Deal created');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save deal');
    }
  };

  const handleDelete = async () => {
    if (!deal) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setIsDeleting(true);
    try {
      await deleteDeal(deal.id);
      toast.success('Deal deleted');
      onSuccess?.();
      onClose();
    } catch {
      toast.error('Failed to delete deal');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const isReadOnly = currentMode === 'view';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-semibold">
            {deal ? (isReadOnly ? 'Deal Details' : 'Edit Deal') : 'New Deal'}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {deal && isReadOnly && (
              <Button
                variant="ghost"
                size="sm"
                className="text-busala-text-muted hover:text-busala-gold h-8"
                onClick={() => setCurrentMode('edit')}
              >
                Edit
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm text-busala-text-muted">Deal Title *</Label>
            <Input
              id="title"
              {...register('title')}
              disabled={isReadOnly}
              placeholder="e.g. Acme Corp — Enterprise Plan"
              className="bg-busala-hover-bg border-border"
            />
            {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
          </div>

          {/* Stage */}
          <div className="space-y-1.5">
            <Label className="text-sm text-busala-text-muted">Stage *</Label>
            <Select
              value={stageId}
              onValueChange={(v) => setValue('stageId', v)}
              disabled={isReadOnly}
            >
              <SelectTrigger className="bg-busala-hover-bg border-border">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {pipeline.stages.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-card-foreground focus:bg-busala-hover-bg">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.stageId && <p className="text-xs text-red-400">{errors.stageId.message}</p>}
          </div>

          {/* Value & Owner */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="value" className="text-sm text-busala-text-muted">Value (USD)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                {...register('value')}
                disabled={isReadOnly}
                placeholder="0"
                className="bg-busala-hover-bg border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ownerName" className="text-sm text-busala-text-muted">Owner</Label>
              <Input
                id="ownerName"
                {...register('ownerName')}
                disabled={isReadOnly}
                placeholder="Name"
                className="bg-busala-hover-bg border-border"
              />
            </div>
          </div>

          {/* Expected Close */}
          <div className="space-y-1.5">
            <Label htmlFor="expectedClose" className="text-sm text-busala-text-muted">Expected Close</Label>
            <Input
              id="expectedClose"
              type="date"
              {...register('expectedClose')}
              disabled={isReadOnly}
              className="bg-busala-hover-bg border-border"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm text-busala-text-muted">Notes</Label>
            <textarea
              id="notes"
              {...register('notes')}
              disabled={isReadOnly}
              rows={3}
              placeholder="Add any notes..."
              className="w-full rounded-md border border-border bg-busala-hover-bg px-3 py-2 text-sm text-busala-text-primary placeholder:text-busala-text-subtle resize-none focus:outline-none focus:ring-1 focus:ring-busala-gold disabled:opacity-60"
            />
          </div>

          {/* Stage History (view mode) */}
          {isReadOnly && deal && deal.stageHistory.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-sm text-busala-text-muted">Stage History</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {deal.stageHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-busala-text-subtle">
                    <span>{h.stageName}</span>
                    <span>{new Date(h.movedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!isReadOnly && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {deal && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 ${deleteConfirm ? 'bg-red-500/10' : ''}`}
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  {deleteConfirm ? 'Confirm delete' : 'Delete'}
                </Button>
              )}
              <div className={`flex gap-2 ${!deal ? 'ml-auto' : ''}`}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-border h-8"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="busala-gradient-gold text-[#0B0D10] font-semibold h-8"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving…' : deal ? 'Save Changes' : 'Create Deal'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
