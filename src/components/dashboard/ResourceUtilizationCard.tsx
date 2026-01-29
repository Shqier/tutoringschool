'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resourceUtilization } from '@/data/mock-data';

// Heatmap visualization component
function Heatmap() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = [9, 10, 11, 12, 13, 14, 15];

  const getHeatmapValue = (day: string, hour: number) => {
    const cell = resourceUtilization.rooms.heatmap.find(
      (c) => c.day === day && c.hour === hour
    );
    return cell?.value || 0;
  };

  const getHeatmapColor = (value: number) => {
    if (value >= 0.8) return 'bg-busala-gold';
    if (value >= 0.6) return 'bg-busala-gold/70';
    if (value >= 0.4) return 'bg-busala-gold/40';
    if (value >= 0.2) return 'bg-busala-gold/20';
    return 'bg-busala-hover-bg';
  };

  return (
    <div className="mt-4">
      <div className="flex gap-1">
        {/* Y-axis labels */}
        <div className="flex flex-col gap-1 pr-2">
          <div className="h-4" /> {/* Empty space for X-axis */}
          {hours.map((hour) => (
            <div key={hour} className="h-5 text-[10px] text-busala-text-subtle flex items-center">
              {hour}:00
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex-1">
          {/* X-axis labels */}
          <div className="flex gap-1 mb-1">
            {days.map((day) => (
              <div key={day} className="flex-1 text-[10px] text-busala-text-subtle text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          {hours.map((hour) => (
            <div key={hour} className="flex gap-1 mb-1">
              {days.map((day) => (
                <div
                  key={`${day}-${hour}`}
                  className={`flex-1 h-5 rounded-sm ${getHeatmapColor(getHeatmapValue(day, hour))} transition-colors hover:ring-1 hover:ring-busala-gold/50`}
                  title={`${day} ${hour}:00 - ${Math.round(getHeatmapValue(day, hour) * 100)}% utilization`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="text-[10px] text-busala-text-subtle">Low</span>
        <div className="flex gap-0.5">
          <div className="w-4 h-3 rounded-sm bg-busala-hover-bg" />
          <div className="w-4 h-3 rounded-sm bg-busala-gold/20" />
          <div className="w-4 h-3 rounded-sm bg-busala-gold/40" />
          <div className="w-4 h-3 rounded-sm bg-busala-gold/70" />
          <div className="w-4 h-3 rounded-sm bg-busala-gold" />
        </div>
        <span className="text-[10px] text-busala-text-subtle">High</span>
      </div>
    </div>
  );
}

export function ResourceUtilizationCard() {
  const rooms = resourceUtilization.rooms;
  const teachers = resourceUtilization.teachers;

  return (
    <div className="busala-card p-4 h-full flex flex-col">
      <Tabs defaultValue="rooms" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-busala-text-primary">Resource Utilization</h3>
          <TabsList className="bg-busala-hover-bg border border-busala-border-glass">
            <TabsTrigger
              value="rooms"
              className="text-xs data-[state=active]:bg-busala-gold/10 data-[state=active]:text-busala-gold"
            >
              Rooms
            </TabsTrigger>
            <TabsTrigger
              value="teachers"
              className="text-xs data-[state=active]:bg-busala-gold/10 data-[state=active]:text-busala-gold"
            >
              Teachers
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rooms" className="flex-1 mt-0">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-busala-hover-bg border border-busala-border-glass">
              <p className="text-xl font-semibold text-busala-text-primary">{rooms.inUse}</p>
              <p className="text-[10px] text-busala-text-subtle">In Use</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-busala-hover-bg border border-busala-border-glass">
              <p className="text-xl font-semibold text-busala-text-primary">{rooms.available}</p>
              <p className="text-[10px] text-busala-text-subtle">Available</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-busala-hover-bg border border-busala-border-glass">
              <p className="text-xl font-semibold text-busala-gold">{rooms.utilizationPercent}%</p>
              <p className="text-[10px] text-busala-text-subtle">Utilization</p>
            </div>
          </div>

          {/* Heatmap */}
          <Heatmap />
        </TabsContent>

        <TabsContent value="teachers" className="flex-1 mt-0">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-busala-hover-bg border border-busala-border-glass">
              <p className="text-xl font-semibold text-busala-text-primary">{teachers.teaching}</p>
              <p className="text-[10px] text-busala-text-subtle">Teaching</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-busala-hover-bg border border-busala-border-glass">
              <p className="text-xl font-semibold text-busala-text-primary">{teachers.available}</p>
              <p className="text-[10px] text-busala-text-subtle">Available</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-busala-hover-bg border border-busala-border-glass">
              <p className="text-xl font-semibold text-busala-gold">{teachers.utilizationPercent}%</p>
              <p className="text-[10px] text-busala-text-subtle">Utilization</p>
            </div>
          </div>

          {/* Placeholder for teacher heatmap */}
          <div className="flex-1 flex items-center justify-center text-busala-text-subtle text-sm">
            Teacher availability heatmap
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
