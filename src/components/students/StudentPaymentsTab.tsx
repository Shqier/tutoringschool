'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePayments, useLessonCredits, useRecordPayment } from '@/lib/api/hooks';
import type { Student } from '@/lib/api/types';

const formatILS = (amount: number) =>
  new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);

interface StudentPaymentsTabProps {
  studentId: string;
  student: Student;
  onRefetch: () => void;
}

export function StudentPaymentsTab({ studentId, student, onRefetch }: StudentPaymentsTabProps) {
  const { data: creditsData, isLoading: creditsLoading } = useLessonCredits(studentId);
  const { data: paymentsData, isLoading: paymentsLoading, refetch: refetchPayments } = usePayments({ studentId });
  const { mutate: recordPayment } = useRecordPayment();

  const credits = creditsData?.credits;
  const plan = creditsData?.plan;
  const payments = paymentsData?.payments ?? [];

  const handleRecordPayment = async (paymentId: string, method: 'cash' | 'bank_transfer') => {
    try {
      await recordPayment({ paymentId, paymentMethod: method });
      refetchPayments();
      onRefetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan & Credits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="busala-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-busala-text-muted">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {creditsLoading ? (
              <p className="text-sm text-busala-text-muted">Loading…</p>
            ) : (
              <>
                <p className="text-lg font-semibold text-busala-text-primary">{plan?.name ?? student.plan?.name ?? 'No plan'}</p>
                {credits && (
                  <p className="text-sm text-busala-text-muted mt-1">
                    {credits.lessonsUsed} / {credits.lessonsIncluded} lessons used • {credits.lessonsRemaining} remaining
                  </p>
                )}
                {plan?.lessonsPerMonth && (
                  <p className="text-xs text-busala-text-subtle mt-1">Resets: {new Date(credits?.resetDate ?? '').toLocaleDateString()}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <Card className="busala-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-busala-text-muted">Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`text-lg font-semibold capitalize ${
              student.paymentStatus === 'overdue' ? 'text-red-400' :
              student.paymentStatus === 'active' ? 'text-emerald-400' :
              'text-busala-text-muted'
            }`}>
              {student.paymentStatus ?? '—'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="busala-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-busala-text-muted">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <p className="text-sm text-busala-text-muted">Loading…</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-busala-text-muted">No payments yet.</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-busala-border last:border-0"
                >
                  <div>
                    <span className="text-sm font-medium text-busala-text-primary">{formatILS(p.amount)}</span>
                    <span className="text-xs text-busala-text-muted ml-2 capitalize">{p.type.replace('_', ' ')}</span>
                    <span className={`text-xs ml-2 capitalize ${
                      p.status === 'completed' ? 'text-emerald-400' :
                      p.status === 'pending' ? 'text-amber-400' :
                      'text-busala-text-muted'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="text-xs text-busala-text-muted">
                    Due: {new Date(p.dueDate).toLocaleDateString()}
                    {p.paidDate && ` • Paid: ${new Date(p.paidDate).toLocaleDateString()}`}
                  </div>
                  {p.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRecordPayment(p.id, 'cash')} className="text-xs">
                        Record Cash
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRecordPayment(p.id, 'bank_transfer')} className="text-xs">
                        Bank Transfer
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
