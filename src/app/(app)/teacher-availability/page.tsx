'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PageHeader,
  SkeletonTable,
} from '@/components/app';
import { usePendingConfirmations } from '@/lib/api/hooks';

export default function TeacherAvailabilityPage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data, isLoading, error, refetch } = usePendingConfirmations(
    selectedMonth,
    selectedYear
  );

  const handleSendReminder = (teacherId: string) => {
    // TODO: Implement reminder notification
    console.log('Send reminder to teacher:', teacherId);
  };

  const handleAutoConfirm = (teacherId: string) => {
    // TODO: Implement auto-confirm
    console.log('Auto-confirm teacher:', teacherId);
  };

  const handleViewTeacher = (teacherId: string) => {
    router.push(`/teachers/${teacherId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Teacher Availability"
          subtitle="Manage teacher schedules and confirmations"
        />
        <SkeletonTable rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Teacher Availability"
          subtitle="Manage teacher schedules and confirmations"
        />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load availability data</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = data?.summary;
  const teachers = data?.teachers;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Availability"
        subtitle="Manage teacher schedules and monthly confirmations"
        actionLabel="Refresh"
        actionIcon={RefreshCw}
        onAction={() => refetch()}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{summary?.total || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{summary?.pending || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{summary?.confirmed || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Auto-Confirm In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{summary?.daysUntilAutoConfirm || 0}</span>
              <span className="text-sm text-gray-500">days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Lists */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({teachers?.pending.length || 0})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({teachers?.confirmed.length || 0})
          </TabsTrigger>
          <TabsTrigger value="updated">
            Updated ({teachers?.updated.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {teachers?.pending.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>All teachers have confirmed their availability!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="busala-card">
              {teachers?.pending.map((teacher, index) => (
                <div 
                  key={teacher.id} 
                  className={`flex items-center justify-between p-4 hover:bg-busala-hover-bg cursor-pointer ${index !== (teachers?.pending.length || 0) - 1 ? 'border-b' : ''}`}
                  style={{ borderColor: 'var(--busala-border-divider)' }}
                  onClick={() => handleViewTeacher(teacher.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="font-medium text-amber-700">
                        {teacher.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{teacher.fullName}</p>
                      <p className="text-sm text-gray-500">{teacher.email}</p>
                      {!teacher.hasAvailability && (
                        <Badge variant="destructive" className="mt-1">
                          No availability set
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {teacher.daysSinceConfirmed !== null && (
                      <span className="text-sm text-gray-500">
                        Last confirmed: {teacher.daysSinceConfirmed} days ago
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendReminder(teacher.id);
                      }}
                    >
                      <Bell className="h-4 w-4 mr-1" />
                      Remind
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="confirmed">
          <div className="busala-card">
            {teachers?.confirmed.map((teacher, index) => (
              <div 
                key={teacher.id} 
                className={`flex items-center justify-between p-4 hover:bg-busala-hover-bg cursor-pointer ${index !== (teachers?.confirmed.length || 0) - 1 ? 'border-b' : ''}`}
                style={{ borderColor: 'var(--busala-border-divider)' }}
                onClick={() => handleViewTeacher(teacher.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="font-medium text-green-700">
                      {teacher.fullName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{teacher.fullName}</p>
                    <p className="text-sm text-gray-500">{teacher.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Confirmed</Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="updated">
          <div className="busala-card">
            {teachers?.updated.map((teacher, index) => (
              <div 
                key={teacher.id} 
                className={`flex items-center justify-between p-4 hover:bg-busala-hover-bg cursor-pointer ${index !== (teachers?.updated.length || 0) - 1 ? 'border-b' : ''}`}
                style={{ borderColor: 'var(--busala-border-divider)' }}
                onClick={() => handleViewTeacher(teacher.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="font-medium text-blue-700">
                      {teacher.fullName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{teacher.fullName}</p>
                    <p className="text-sm text-gray-500">{teacher.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Updated</Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
