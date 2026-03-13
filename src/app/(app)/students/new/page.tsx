'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudentDialog } from '@/components/students/StudentDialog';
import { useEntityDialog } from '@/hooks/useEntityDialog';
import type { Student } from '@/lib/api/types';

export default function NewStudentPage() {
  const router = useRouter();
  const dialog = useEntityDialog<Student>();

  useEffect(() => {
    dialog.openCreate();
  }, []);

  const handleClose = () => {
    dialog.close();
    router.replace('/students');
  };

  const handleSuccess = () => {
    dialog.close();
    router.replace('/students');
  };

  return (
    <div className="space-y-6">
      <StudentDialog
        isOpen={dialog.isOpen}
        onClose={handleClose}
        mode={dialog.mode}
        entity={dialog.entity}
        switchToEdit={dialog.switchToEdit}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
