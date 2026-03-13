'use client';

import React, { useMemo, useCallback } from 'react';
import type { DayAvailability } from '@/lib/api/types';

const DAYS: { key: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const HOUR_START = 8;
const HOUR_END = 20;
const CELL_MINUTES = 30;

interface WeeklyScheduleEditorProps {
  availability: DayAvailability[];
  onChange: (availability: DayAvailability[]) => void;
  readOnly?: boolean;
  className?: string;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Convert day availability to a grid of booleans (dayIndex, slotIndex) -> available */
function availabilityToGrid(availability: DayAvailability[]): boolean[][] {
  const grid: boolean[][] = DAYS.map(() => []);
  const totalSlots = ((HOUR_END - HOUR_START) * 60) / CELL_MINUTES;
  for (let d = 0; d < 7; d++) {
    for (let s = 0; s < totalSlots; s++) {
      grid[d][s] = false;
    }
  }
  const dayKeys = DAYS.map((x) => x.key);
  for (const day of availability) {
    const dayIdx = dayKeys.indexOf(day.day);
    if (dayIdx < 0) continue;
    for (const slot of day.slots) {
      const startMin = timeToMinutes(slot.start) - HOUR_START * 60;
      const endMin = timeToMinutes(slot.end) - HOUR_START * 60;
      const startSlot = Math.max(0, Math.floor(startMin / CELL_MINUTES));
      const endSlot = Math.min(totalSlots, Math.ceil(endMin / CELL_MINUTES));
      for (let i = startSlot; i < endSlot; i++) {
        grid[dayIdx][i] = true;
      }
    }
  }
  return grid;
}

/** Convert grid back to DayAvailability (merge consecutive slots) */
function gridToAvailability(grid: boolean[][]): DayAvailability[] {
  const totalSlots = ((HOUR_END - HOUR_START) * 60) / CELL_MINUTES;
  return DAYS.map((day, dayIdx) => {
    const slots: { start: string; end: string }[] = [];
    let slotStart: number | null = null;
    for (let s = 0; s <= totalSlots; s++) {
      const on = s < totalSlots && grid[dayIdx][s];
      if (on && slotStart === null) {
        slotStart = s;
      } else if (!on && slotStart !== null) {
        slots.push({
          start: minutesToTime(HOUR_START * 60 + slotStart * CELL_MINUTES),
          end: minutesToTime(HOUR_START * 60 + s * CELL_MINUTES),
        });
        slotStart = null;
      }
    }
    return { day: day.key, slots };
  });
}

export function WeeklyScheduleEditor({
  availability,
  onChange,
  readOnly = false,
  className = '',
}: WeeklyScheduleEditorProps) {
  const grid = useMemo(() => availabilityToGrid(availability), [availability]);
  const totalSlots = ((HOUR_END - HOUR_START) * 60) / CELL_MINUTES;
  const hourLabels = useMemo(() => {
    const labels: string[] = [];
    for (let h = HOUR_START; h < HOUR_END; h++) {
      labels.push(`${h}:00`);
    }
    return labels;
  }, []);

  const toggle = useCallback(
    (dayIdx: number, slotIdx: number) => {
      if (readOnly) return;
      const next = grid.map((row, d) =>
        d === dayIdx ? row.map((v, s) => (s === slotIdx ? !v : v)) : [...row]
      );
      onChange(gridToAvailability(next));
    },
    [grid, onChange, readOnly]
  );

  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="inline-block min-w-[600px]">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `60px repeat(${totalSlots}, minmax(0, 1fr))` }}>
          <div className="text-xs text-busala-text-muted font-medium" />
          {Array.from({ length: totalSlots }, (_, i) => (
            <div key={i} className="text-[10px] text-busala-text-muted text-center py-0.5">
              {i % 2 === 0 ? hourLabels[Math.floor(i / 2)] : ''}
            </div>
          ))}
          {DAYS.map((day, dayIdx) => (
            <React.Fragment key={day.key}>
              <div className="text-xs font-medium text-busala-text-primary py-1 pr-2">{day.label}</div>
              {Array.from({ length: totalSlots }, (_, slotIdx) => (
                <button
                  key={slotIdx}
                  type="button"
                  onClick={() => toggle(dayIdx, slotIdx)}
                  disabled={readOnly}
                  className={`
                    h-6 rounded min-w-0
                    ${grid[dayIdx][slotIdx] ? 'bg-green-500/70 hover:bg-green-500/90' : 'bg-busala-hover-bg hover:bg-busala-active-bg'}
                    ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                  `}
                  title={`${day.label} ${minutesToTime(HOUR_START * 60 + slotIdx * CELL_MINUTES)}`}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
