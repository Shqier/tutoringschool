'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  DoorOpen,
  Users,
  MapPin,
  Wrench,
  Edit,
  Calendar,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  StatusBadge,
  SkeletonCard,
} from '@/components/app';
import { useRoom, useLessons } from '@/lib/api/hooks';
import type { Lesson } from '@/lib/api/types';

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const { data: room, isLoading, error } = useRoom(roomId);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const todayEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, []);

  const { data: lessonsData } = useLessons({
    roomId,
    startDate: todayStart,
    endDate: todayEnd,
  });

  const todayLessons = useMemo(() => {
    if (!lessonsData?.lessons) return [];
    return [...lessonsData.lessons].sort(
      (a: Lesson, b: Lesson) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }, [lessonsData]);

  const utilizationPercent = useMemo(() => {
    if (!room) return 0;
    if (room.utilizationPercent !== undefined) return room.utilizationPercent;
    if (room.currentOccupancy !== undefined && room.capacity > 0) {
      return Math.round((room.currentOccupancy / room.capacity) * 100);
    }
    return 0;
  }, [room]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-6 w-48 bg-busala-hover-bg rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8"><SkeletonCard /></div>
          <div className="col-span-12 lg:col-span-4"><SkeletonCard /></div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-busala-text-primary">Room Not Found</h1>
        </div>
        <div className="busala-card p-8 text-center">
          <p className="text-busala-text-muted mb-4">This room could not be found or you don&apos;t have access.</p>
          <Button onClick={() => router.push('/rooms')} className="busala-gradient-gold text-[#0B0D10]">
            Back to Rooms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/rooms')}
            className="text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-busala-text-primary">{room.name}</h1>
            <p className="text-sm text-busala-text-subtle">Room Details</p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/rooms')}
          className="busala-gradient-gold text-[#0B0D10] hover:opacity-90"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Room
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Room Info Card */}
          <div className="busala-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-xl bg-[#F5A623]/20 flex items-center justify-center">
                <DoorOpen className="h-8 w-8 text-[#F5A623]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-busala-text-primary">{room.name}</h2>
                  <StatusBadge status={room.status} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-busala-text-muted">
                  {room.floor && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-busala-text-subtle" />
                      Floor {room.floor}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-busala-text-subtle" />
                    Capacity: {room.capacity}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-2xl font-semibold text-[#F5A623]">{room.capacity}</p>
                <p className="text-xs text-busala-text-subtle">Capacity</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-2xl font-semibold text-blue-400">{room.currentOccupancy || 0}</p>
                <p className="text-xs text-busala-text-subtle">Current Occupancy</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className={`text-2xl font-semibold ${
                  utilizationPercent >= 80 ? 'text-red-400' :
                  utilizationPercent >= 50 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {utilizationPercent}%
                </p>
                <p className="text-xs text-busala-text-subtle">Utilization</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-2xl font-semibold text-emerald-400">{todayLessons.length}</p>
                <p className="text-xs text-busala-text-subtle">Lessons Today</p>
              </div>
            </div>
          </div>

          {/* Equipment Section */}
          <div className="busala-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-[#F5A623]" />
              <h3 className="text-base font-semibold text-busala-text-primary">Equipment</h3>
            </div>
            {(!room.equipment || room.equipment.length === 0) ? (
              <p className="text-sm text-busala-text-muted text-center py-4">No equipment listed</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {room.equipment.map((item, idx) => (
                  <Badge
                    key={idx}
                    className="bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20 text-sm px-3 py-1"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Today's Schedule */}
          <div className="busala-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#F5A623]" />
                <h3 className="text-base font-semibold text-busala-text-primary">Today&apos;s Schedule</h3>
              </div>
              <button
                className="text-xs text-[#F5A623] hover:underline"
                onClick={() => router.push(`/lessons?roomId=${roomId}`)}
              >
                View all
              </button>
            </div>

            {todayLessons.length === 0 ? (
              <p className="text-sm text-busala-text-muted text-center py-6">No lessons scheduled today</p>
            ) : (
              <div className="space-y-3">
                {todayLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-busala-hover-bg hover:bg-busala-active-bg transition-colors"
                  >
                    <div className="w-14 h-14 rounded-lg bg-busala-active-bg flex flex-col items-center justify-center">
                      <span className="text-[10px] text-busala-text-subtle uppercase">
                        {new Date(lesson.startAt).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="text-sm font-semibold text-busala-text-primary">
                        {new Date(lesson.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-busala-text-primary truncate">{lesson.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-busala-text-muted">
                        {lesson.teacherName && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {lesson.teacherName}
                          </span>
                        )}
                        {lesson.groupName && (
                          <span>{lesson.groupName}</span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={lesson.status === 'in_progress' ? 'in-progress' : lesson.status as 'upcoming' | 'completed' | 'cancelled'} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Room Details */}
          <div className="busala-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <DoorOpen className="h-4 w-4 text-[#F5A623]" />
              <h3 className="text-sm font-medium text-busala-text-muted">Room Info</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Name</span>
                <span className="text-sm font-medium text-busala-text-primary">{room.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Floor</span>
                <span className="text-sm font-medium text-busala-text-primary">{room.floor || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Capacity</span>
                <span className="text-sm font-medium text-busala-text-primary">{room.capacity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Status</span>
                <StatusBadge status={room.status} />
              </div>
            </div>
          </div>

          {/* Utilization */}
          <div className="busala-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-[#F5A623]" />
              <h3 className="text-sm font-medium text-busala-text-muted">Utilization</h3>
            </div>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-24 h-24">
                <svg className="transform -rotate-90 w-24 h-24" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--busala-hover-bg)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={
                      utilizationPercent >= 80 ? '#ef4444' :
                      utilizationPercent >= 50 ? '#f59e0b' :
                      '#10b981'
                    }
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(utilizationPercent / 100) * 264} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-semibold text-busala-text-primary">
                    {utilizationPercent}%
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-busala-text-muted text-center">
              {utilizationPercent >= 80
                ? 'High utilization - consider alternate rooms'
                : utilizationPercent >= 50
                ? 'Moderate utilization'
                : 'Low utilization - available for booking'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="busala-card p-4">
            <h3 className="text-sm font-medium text-busala-text-muted mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
                onClick={() => router.push('/rooms')}
              >
                <Edit className="h-4 w-4 mr-2 text-[#F5A623]" />
                Edit Room
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
                onClick={() => router.push('/scheduling')}
              >
                <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                View Schedule
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
