'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Users,
  DoorOpen,
  Wrench,
  CheckCircle,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PageHeader,
  FiltersBar,
  StatusBadge,
  SkeletonCard,
  EmptyState,
  ConfirmDialog,
} from '@/components/app';
import { RoomDialog } from '@/components/rooms/RoomDialog';
import { useRooms, useDeleteRoom } from '@/lib/api/hooks';
import type { Room } from '@/lib/api/types';

export default function RoomsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // Fetch rooms
  const { data: roomsData, isLoading, error, refetch } = useRooms();
  const { mutate: deleteRoom, isLoading: deleteLoading } = useDeleteRoom();

  const rooms = useMemo(() => roomsData?.rooms || [], [roomsData]);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rooms, searchQuery, statusFilter]);

  // Stats
  const availableRooms = rooms.filter((r) => r.status === 'available').length;
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance').length;

  const handleAddClick = () => {
    setEditingRoom(null);
    setDialogOpen(true);
  };

  const handleEditClick = (room: Room) => {
    setEditingRoom(room);
    setDialogOpen(true);
  };

  const handleDeleteClick = (room: Room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    try {
      await deleteRoom(roomToDelete.id);
      toast.success('Room deleted successfully');
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete room');
    }
  };

  // Render content
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="busala-card p-8 text-center">
          <p className="text-red-400 mb-4">Failed to load rooms</p>
          <Button onClick={() => refetch()} className="busala-gradient-gold text-[#0B0D10]">
            Retry
          </Button>
        </div>
      );
    }

    if (filteredRooms.length === 0) {
      return (
        <div className="busala-card">
          <EmptyState
            title="No rooms found"
            description={rooms.length === 0 ? "Add your first room to get started." : "No rooms match your current filters."}
            actionLabel={rooms.length === 0 ? "Add Room" : undefined}
            onAction={rooms.length === 0 ? handleAddClick : undefined}
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            className="busala-card busala-card-hover p-4 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-busala-hover-bg flex items-center justify-center">
                  <DoorOpen className="h-6 w-6 text-[#F5A623]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-busala-text-primary">{room.name}</p>
                  <p className="text-xs text-busala-text-subtle">{room.floor || 'No floor specified'}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-busala-text-subtle hover:text-busala-text-primary hover:bg-busala-hover-bg"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem className="text-card-foreground hover:text-card-foreground focus:bg-busala-hover-bg focus:text-card-foreground">
                    View Schedule
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-card-foreground hover:text-card-foreground focus:bg-busala-hover-bg focus:text-card-foreground"
                    onClick={() => handleEditClick(room)}
                  >
                    Edit Room
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-400 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400"
                    onClick={() => handleDeleteClick(room)}
                  >
                    Delete Room
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status & Capacity */}
            <div className="flex items-center justify-between">
              <StatusBadge status={room.status} />
              <div className="flex items-center gap-1.5 text-busala-text-muted">
                <Users className="h-4 w-4" />
                <span className="text-sm">
                  {room.currentOccupancy || 0}/{room.capacity}
                </span>
              </div>
            </div>

            {/* Utilization */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-busala-text-muted">Utilization</span>
                <span className="text-busala-text-primary">{room.utilizationPercent || 0}%</span>
              </div>
              <div className="h-2 bg-busala-hover-bg rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (room.utilizationPercent || 0) >= 70
                      ? 'bg-emerald-500'
                      : (room.utilizationPercent || 0) >= 40
                      ? 'bg-[#F5A623]'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${room.utilizationPercent || 0}%` }}
                />
              </div>
            </div>

            {/* Equipment */}
            {room.equipment && room.equipment.length > 0 && (
              <div className="pt-3 border-t" style={{ borderColor: 'var(--busala-border-divider)' }}>
                <p className="text-xs text-busala-text-subtle mb-2">Equipment</p>
                <div className="flex flex-wrap gap-2">
                  {room.equipment.slice(0, 4).map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 rounded-md bg-busala-hover-bg text-busala-text-muted"
                    >
                      {item}
                    </span>
                  ))}
                  {room.equipment.length > 4 && (
                    <span className="text-xs px-2 py-1 rounded-md bg-busala-hover-bg text-busala-text-subtle">
                      +{room.equipment.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary text-xs"
              >
                View Schedule
              </Button>
              {room.status === 'available' && (
                <Button
                  size="sm"
                  className="flex-1 busala-gradient-gold text-[#0B0D10] hover:opacity-90 text-xs"
                >
                  Book Now
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms"
        subtitle={`${rooms.length} rooms in your facility`}
        actionLabel="Add Room"
        actionIcon={Plus}
        onAction={handleAddClick}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="busala-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-busala-text-primary">{availableRooms}</p>
              <p className="text-xs text-busala-text-subtle">Available</p>
            </div>
          </div>
        </div>
        <div className="busala-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-busala-text-primary">{occupiedRooms}</p>
              <p className="text-xs text-busala-text-subtle">Occupied</p>
            </div>
          </div>
        </div>
        <div className="busala-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-busala-text-primary">{maintenanceRooms}</p>
              <p className="text-xs text-busala-text-subtle">Maintenance</p>
            </div>
          </div>
        </div>
      </div>

      <FiltersBar
        searchPlaceholder="Search rooms..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'status',
            placeholder: 'All Statuses',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'available', label: 'Available' },
              { value: 'occupied', label: 'Occupied' },
              { value: 'maintenance', label: 'Maintenance' },
            ],
          },
        ]}
      />

      {/* Room Cards Grid */}
      {renderContent()}

      {/* Room Dialog (Add/Edit) */}
      <RoomDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
        room={editingRoom}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Room"
        description={`Are you sure you want to delete "${roomToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
