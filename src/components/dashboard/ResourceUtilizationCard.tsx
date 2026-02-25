// ============================================
// RESOURCE UTILIZATION CARD - Wired to Live API
// Updated: Phase 3 - Frontend-Backend Integration
// Shows room and teacher utilization with real-time data
// ============================================

'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useRooms, useTeachers, useLessons } from '@/lib/api/hooks';

// Heatmap visualization component (placeholder - real heatmap requires more complex data processing)
function Heatmap({ type: _type }: { type: 'rooms' | 'teachers' }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = [9, 10, 11, 12, 13, 14, 15];

  // For now, show a placeholder heatmap
  // Real implementation would require fetching lessons grouped by time slots
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

          {/* Grid - Placeholder with random values */}
          {hours.map((hour) => (
            <div key={hour} className="flex gap-1 mb-1">
              {days.map((day) => {
                // Placeholder: simulate some activity
                const value = Math.random() * 0.7; // 0-70% utilization
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`flex-1 h-5 rounded-sm ${getHeatmapColor(value)} transition-colors hover:ring-1 hover:ring-busala-gold/50`}
                    title={`${day} ${hour}:00 - ${Math.round(value * 100)}% utilization`}
                  />
                );
              })}
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

function MetricSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-3" />
      <p className="text-sm text-red-400 mb-2">Failed to load data</p>
      <p className="text-xs text-busala-text-subtle mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="text-xs text-busala-gold hover:underline"
      >
        Retry
      </button>
    </div>
  );
}

export function ResourceUtilizationCard() {
  // Get today's date for lessons filter
  const today = new Date().toISOString().split('T')[0];

  // Fetch data
  const { data: roomsData, isLoading: loadingRooms, error: roomsError, refetch: refetchRooms } = useRooms();
  const { data: teachersData, isLoading: loadingTeachers, error: teachersError, refetch: refetchTeachers } = useTeachers({ status: 'active' });
  const { data: lessonsData, isLoading: loadingLessons } = useLessons({ date: today, status: 'in_progress' });

  // Calculate room metrics
  const totalRooms = roomsData?.total || 0;
  const occupiedRooms = roomsData?.rooms?.filter(r => r.status === 'occupied').length || 0;
  const availableRooms = totalRooms - occupiedRooms;
  const roomUtilization = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Calculate teacher metrics
  const totalTeachers = teachersData?.total || 0;
  // Teachers currently teaching (have lessons in progress today)
  const teachingNow = lessonsData?.lessons?.reduce((acc, lesson) => {
    if (lesson.teacherId && !acc.includes(lesson.teacherId)) {
      acc.push(lesson.teacherId);
    }
    return acc;
  }, [] as string[]).length || 0;
  const availableTeachers = totalTeachers - teachingNow;
  const teacherUtilization = totalTeachers > 0 ? Math.round((teachingNow / totalTeachers) * 100) : 0;

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

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="flex-1 mt-0">
          {loadingRooms || loadingLessons ? (
            <MetricSkeleton />
          ) : roomsError ? (
            <ErrorState
              error={roomsError.message || 'Unable to load room data'}
              onRetry={refetchRooms}
            />
          ) : (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg bg-busala-hover-bg border border-busala-border-glass">
                  <p className="text-xl font-semibold text-busala-text-primary">{occupiedRooms}</p>
                  <p className="text-[10px] text-busala-text-subtle">In Use</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-busala-hover-bg border border-busala-border-glass">
                  <p className="text-xl font-semibold text-busala-text-primary">{availableRooms}</p>
                  <p className="text-[10px] text-busala-text-subtle">Available</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-busala-hover-bg border border-busala-border-glass">
                  <p className="text-xl font-semibold text-busala-gold">{roomUtilization}%</p>
                  <p className="text-[10px] text-busala-text-subtle">Utilization</p>
                </div>
              </div>

              {/* Heatmap */}
              <Heatmap type="rooms" />
            </>
          )}
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="flex-1 mt-0">
          {loadingTeachers || loadingLessons ? (
            <MetricSkeleton />
          ) : teachersError ? (
            <ErrorState
              error={teachersError.message || 'Unable to load teacher data'}
              onRetry={refetchTeachers}
            />
          ) : (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg bg-busala-hover-bg border border-busala-border-glass">
                  <p className="text-xl font-semibold text-busala-text-primary">{teachingNow}</p>
                  <p className="text-[10px] text-busala-text-subtle">Teaching</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-busala-hover-bg border border-busala-border-glass">
                  <p className="text-xl font-semibold text-busala-text-primary">{availableTeachers}</p>
                  <p className="text-[10px] text-busala-text-subtle">Available</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-busala-hover-bg border border-busala-border-glass">
                  <p className="text-xl font-semibold text-busala-gold">{teacherUtilization}%</p>
                  <p className="text-[10px] text-busala-text-subtle">Utilization</p>
                </div>
              </div>

              {/* Heatmap */}
              <Heatmap type="teachers" />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
