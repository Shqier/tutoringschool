# Busala Payment Plans Specification

## Overview

This document defines the payment plan system for Busala, supporting subscription-based group lessons and pay-as-you-go private lessons across two grade tiers.

## Grade Tiers

### Tier 1: Elementary & Middle School (Grades 1-9)
- **Group 8**: 8 lessons/month (2/week) — ₪550/month
- **Group 12**: 12 lessons/month (3/week) — ₪850/month
- **Private**: 1-on-1 lessons — ₪100 per lesson (pay-as-you-go)

### Tier 2: High School (Grades 10-12)
- **Group 8**: 8 lessons/month (2/week) — ₪750/month
- **Group 12**: 12 lessons/month (3/week) — ₪950/month
- **Private**: 1-on-1 lessons — ₪120 per lesson (pay-as-you-go)

*Each lesson duration: 60 minutes*

---

## Plan Types

### 1. Subscription Plans (Group Lessons)

**Billing**: Monthly recurring subscription
**Included**: Fixed number of group lessons per month
**Rollover**: Unused lessons do NOT roll over to next month (use-it-or-lose-it)
**Overage**: Students cannot exceed their monthly limit without plan change

| Plan | Lessons/Month | Elementary (1-9) | High School (10-12) |
|------|---------------|------------------|---------------------|
| Group 8 | 8 (2/week) | ₪550 | ₪750 |
| Group 12 | 12 (3/week) | ₪850 | ₪950 |

### 2. Pay-As-You-Go (Private Lessons)

**Billing**: Per-lesson, charged at time of scheduling or completion
**No subscription**: No monthly commitment
**Pricing**: 
- Grades 1-9: ₪100 per 60-min lesson
- Grades 10-12: ₪120 per 60-min lesson

---

## Data Model Changes

### Student Model Updates
Remove current fields:
- ~~`balance`~~ (remove)
- ~~`plan`~~ (remove - string replaced with relation)

New fields:
- `grade`: number (1-12) — determines pricing tier
- `planId`: string? — foreign key to active subscription plan (null if pay-as-you-go)
- `paymentStatus`: 'active' | 'overdue' | 'cancelled' | 'suspended'

### New Models

#### PaymentPlan (Master Plans)
```typescript
interface PaymentPlan {
  id: string;
  name: string;              // "Group 8 - Elementary", "Group 12 - High School"
  tier: 'elementary' | 'high_school';
  type: 'subscription' | 'pay_as_you_go';
  lessonsPerMonth: number;   // 8, 12, or null for pay-as-you-go
  monthlyPrice: number;      // null for pay-as-you-go
  lessonPrice: number;       // null for subscription plans
  duration: number;          // 60 (minutes)
  orgId: string;
  isActive: boolean;
}
```

#### StudentSubscription
```typescript
interface StudentSubscription {
  id: string;
  studentId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'paused';
  startDate: Date;
  endDate?: Date;            // null until cancelled
  billingDay: number;        // 1-31, day of month to charge
  lastPaymentDate?: Date;
  nextPaymentDate: Date;
  orgId: string;
}
```

#### Payment
```typescript
interface Payment {
  id: string;
  studentId: string;
  subscriptionId?: string;   // null for pay-as-you-go private lessons
  amount: number;
  currency: 'ILS';
  type: 'subscription_monthly' | 'private_lesson' | 'prorated' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;    // 'cash', 'bank_transfer', 'credit_card', etc.
  reference?: string;        // external payment reference
  lessonIds?: string[];      // for pay-as-you-go, which lessons this covers
  dueDate: Date;             // when payment should be made
  paidDate?: Date;           // when actually paid
  notes?: string;
  orgId: string;
  createdAt: Date;
}
```

#### LessonCredit (Track monthly usage)
```typescript
interface LessonCredit {
  id: string;
  studentId: string;
  subscriptionId: string;
  year: number;
  month: number;             // 1-12
  lessonsIncluded: number;   // 8 or 12
  lessonsUsed: number;       // how many attended/cancelled late
  lessonsRemaining: number;  // calculated field
  resetDate: Date;           // first day of next month
}
```

---

## Business Logic

### Plan Assignment

**New Student Flow:**
1. Admin selects grade (1-12)
2. Admin selects plan type:
   - Group subscription (8 or 12/month)
   - Pay-as-you-go private only
3. System creates StudentSubscription
4. First payment generated (prorated if mid-month)

**Switching Plans:**
- Can upgrade/downgrade at month end only
- Current month's lessons remain under old plan
- New plan starts 1st of next month
- Prorated charges for mid-month changes not supported (simplified)

### Billing Cycle

**Monthly Subscriptions:**
- All plans bill on 1st of month (configurable per student)
- Payment status becomes "overdue" if not paid by 5th
- Account suspends if overdue > 7 days
- Lessons can still be scheduled but attendance blocked if payment overdue

**Pay-As-You-Go:**
- Payment created when private lesson is scheduled
- Status: "pending" until paid
- Lesson can proceed only if payment completed OR admin override

### Lesson Tracking

**Group Lessons (Subscription):**
- Student attends group lesson → lessonsUsed++
- Cannot attend if lessonsRemaining = 0 (admin override available)
- Late cancellation (<24h) counts as used
- No-show counts as used
- Excused absence (with approval) does NOT count

**Private Lessons (Pay-As-You-Go):**
- Payment must be completed before lesson starts (or marked "paid cash" by admin)
- Multiple lessons can be prepaid and tracked

### Notifications

**Payment Due:**
- 3 days before due date: "Payment of ₪850 due in 3 days"
- On due date: "Payment due today"
- 3 days after: "Payment overdue - please pay to continue"

**Lesson Credits:**
- When 2 lessons remaining: "You have 2 lessons left this month"
- When 0 remaining: "Monthly limit reached - contact admin to upgrade"

**Monthly Reset:**
- 1st of month: Credits reset, new payment generated

---

## UI Requirements

### Admin Views

**Students List:**
- Filter by: plan type, payment status, grade tier
- Columns: Name, Grade, Plan, Monthly Fee, Payment Status, Lessons Used/Remaining

**Student Detail - Payments Tab:**
- Current plan details
- Payment history table
- Current month credit usage
- "Change Plan" button (effective next month)
- "Record Payment" button

**Payments Dashboard:**
- Overdue payments list
- Monthly revenue summary
- Upcoming payments (next 7 days)

### Student Views (Future)

**My Plan:**
- Current plan details
- Lessons used / remaining this month
- Next payment date and amount
- Payment history

---

## Migration Path

1. Create new tables: PaymentPlan, StudentSubscription, Payment, LessonCredit
2. Seed PaymentPlan with 6 plans (2 tiers × 3 plan types)
3. Migrate existing students:
   - Set default grade (admin must review)
   - Convert "Monthly Basic" → appropriate Group plan
   - Create initial subscriptions
4. Remove old `balance` and `plan` fields from Student
5. Update all lesson scheduling logic to check credits/payments

---

## Edge Cases

1. **Mid-month enrollment**: Prorate first month or charge full?
   - Decision: Charge full, give full credits

2. **Month with holidays**: Fewer than 4 weeks?
   - Decision: Still charge full, adjust schedule manually

3. **Student upgrades mid-month**: 
   - Decision: Changes effective 1st of next month only

4. **Multiple private lessons prepaid**:
   - Track in Payment.lessonIds, decrement as used

5. **Refund policy**:
   - Cancelled subscriptions: No refund for current month
   - Unused private lesson prepayments: Full refund available

---

## API Endpoints Needed

- `GET/POST /api/payment-plans`
- `GET/POST /api/students/:id/subscriptions`
- `GET/POST /api/payments`
- `GET /api/payments/overdue`
- `POST /api/payments/:id/record` (mark as paid)
- `GET /api/lesson-credits/:studentId/current`
- `POST /api/lessons/:id/attend` (with credit check)

---

*Document Version: 1.0*
*Last Updated: March 11, 2026*
