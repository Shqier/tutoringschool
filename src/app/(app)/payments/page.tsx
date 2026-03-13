'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/app';
import { useOverduePayments } from '@/lib/api/hooks';

const formatILS = (amount: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);

export default function PaymentsPage() {
  const { data: overdue, isLoading } = useOverduePayments();
  const overduePayments = overdue ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle="Manage payments and track overdue"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="busala-card border-red-500/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-busala-text-muted flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Overdue Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-busala-text-muted">Loading…</p>
            ) : overduePayments.length === 0 ? (
              <p className="text-sm text-emerald-400">No overdue payments</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {overduePayments.map((p) => (
                  <Link key={p.id} href={`/students/${p.studentId}`}>
                    <div className="flex items-center justify-between py-2 border-b border-busala-border last:border-0 hover:bg-busala-hover-bg rounded px-2 -mx-2">
                      <div>
                        <p className="text-sm font-medium text-busala-text-primary">
                          {p.student?.fullName ?? 'Unknown'}
                        </p>
                        <p className="text-xs text-busala-text-muted capitalize">
                          {p.type.replace('_', ' ')} • Due {new Date(p.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-red-400">
                        {formatILS(p.amount)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="busala-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-busala-text-muted">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-busala-text-muted">
              Upcoming payments for the next 7 days can be viewed on the student detail pages. Go to Students and open a student to see their payment schedule.
            </p>
            <Link href="/students" className="mt-4 inline-block">
              <Button variant="outline" size="sm" className="busala-gradient-gold/20 text-busala-gold border-busala-gold/30">
                View Students
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
