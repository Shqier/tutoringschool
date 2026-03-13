'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentAttendanceHistory } from '@/components/attendance';

export default function StudentAttendancePage() {
  const params = useParams();
  const studentId = params.id as string;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-busala-text-muted">
        <Link href="/students" className="hover:text-busala-text-primary transition-colors">
          Students
        </Link>
        <span>/</span>
        <span className="text-busala-text-primary font-medium">Attendance</span>
      </nav>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="text-busala-text-muted hover:text-busala-text-primary"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <StudentAttendanceHistory studentId={studentId} />
    </div>
  );
}
