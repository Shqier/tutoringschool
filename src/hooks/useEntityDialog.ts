/**
 * Generic hook for managing entity dialog state
 * Supports create, view, and edit modes with smooth transitions
 */

import { useState } from 'react';

export type DialogMode = 'create' | 'view' | 'edit';

export interface UseEntityDialogReturn<T = unknown> {
  isOpen: boolean;
  mode: DialogMode;
  entity: T | null;
  openCreate: () => void;
  openView: (data: T) => void;
  openEdit: (data: T) => void;
  switchToEdit: () => void;
  close: () => void;
}

export function useEntityDialog<T = unknown>(): UseEntityDialogReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>('view');
  const [entity, setEntity] = useState<T | null>(null);

  const openCreate = () => {
    setMode('create');
    setEntity(null);
    setIsOpen(true);
  };

  const openView = (data: T) => {
    setMode('view');
    setEntity(data);
    setIsOpen(true);
  };

  const openEdit = (data: T) => {
    setMode('edit');
    setEntity(data);
    setIsOpen(true);
  };

  const switchToEdit = () => {
    if (mode === 'view' && entity) {
      setMode('edit');
    }
  };

  const close = () => {
    setIsOpen(false);
    // Delay reset to allow close animation
    setTimeout(() => {
      setMode('view');
      setEntity(null);
    }, 200);
  };

  return {
    isOpen,
    mode,
    entity,
    openCreate,
    openView,
    openEdit,
    switchToEdit,
    close,
  };
}
