// ============================================
// SUPER ADMIN - PLANS MANAGEMENT
// ============================================

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit,
  Users,
  CreditCard,
  CheckCircle2
} from 'lucide-react';

// This would be fetched from API in production
async function getPlans() {
  return [
    {
      id: 'plan_starter',
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small schools and tutoring centers',
      maxTeachers: 10,
      maxStudents: 100,
      maxGroups: 5,
      maxRooms: 3,
      priceMonthly: 29,
      priceAnnual: 290,
      isActive: true,
      tenantCount: 89,
      features: [
        'Up to 10 teachers',
        'Up to 100 students',
        '5 groups',
        '3 rooms',
        'Basic scheduling',
        'Email support',
      ],
    },
    {
      id: 'plan_growth',
      name: 'Growth',
      slug: 'growth',
      description: 'For growing institutions with advanced needs',
      maxTeachers: 30,
      maxStudents: 500,
      maxGroups: 15,
      maxRooms: 10,
      priceMonthly: 79,
      priceAnnual: 790,
      isActive: true,
      tenantCount: 45,
      features: [
        'Up to 30 teachers',
        'Up to 500 students',
        '15 groups',
        '10 rooms',
        'Advanced scheduling',
        'Priority support',
        'Analytics dashboard',
      ],
    },
    {
      id: 'plan_enterprise',
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Unlimited everything for large organizations',
      maxTeachers: 999999,
      maxStudents: 999999,
      maxGroups: 999999,
      maxRooms: 999999,
      priceMonthly: 199,
      priceAnnual: 1990,
      isActive: true,
      tenantCount: 12,
      features: [
        'Unlimited teachers',
        'Unlimited students',
        'Unlimited groups',
        'Unlimited rooms',
        'Advanced scheduling',
        'Premium support',
        'Analytics & Reporting',
        'Custom integrations',
        'Dedicated account manager',
      ],
    },
  ];
}

export default async function PlansPage() {
  const plans = await getPlans();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plans</h1>
          <p className="text-slate-400">Manage pricing plans and features</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950">
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      {/* Feature Comparison */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Feature Comparison</CardTitle>
          <CardDescription className="text-slate-400">
            Compare features across all plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-3 px-4 text-sm font-medium text-white">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="py-3 px-4 text-sm text-slate-300">Teachers</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-sm text-slate-400">
                      {plan.maxTeachers === 999999 ? 'Unlimited' : plan.maxTeachers}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-slate-300">Students</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-sm text-slate-400">
                      {plan.maxStudents === 999999 ? 'Unlimited' : plan.maxStudents}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-slate-300">Groups</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-sm text-slate-400">
                      {plan.maxGroups === 999999 ? 'Unlimited' : plan.maxGroups}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-slate-300">Rooms</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center py-3 px-4 text-sm text-slate-400">
                      {plan.maxRooms === 999999 ? 'Unlimited' : plan.maxRooms}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanCard({ plan }: { plan: any }) {
  const isPopular = plan.slug === 'growth';

  return (
    <Card className={`bg-slate-900 border-slate-800 relative ${isPopular ? 'border-amber-500/50' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-amber-500 text-slate-950 font-semibold">
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Switch checked={plan.isActive} />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Edit className="h-4 w-4 text-slate-400" />
            </Button>
          </div>
        </div>
        <CardDescription className="text-slate-400">
          {plan.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Pricing */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">${plan.priceMonthly}</span>
          <span className="text-slate-500">/month</span>
        </div>
        <p className="text-sm text-slate-500">
          ${plan.priceAnnual}/year (save {(plan.priceMonthly * 12 - plan.priceAnnual).toFixed(0)}%)
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 py-4 border-y border-slate-800">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Users className="h-4 w-4" />
            {plan.tenantCount} tenants
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-white">Features</p>
          <ul className="space-y-2">
            {plan.features.map((feature: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Limits */}
        <div className="pt-4 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-slate-500">Teachers</div>
            <div className="text-right text-slate-300">
              {plan.maxTeachers === 999999 ? '∞' : plan.maxTeachers}
            </div>
            <div className="text-slate-500">Students</div>
            <div className="text-right text-slate-300">
              {plan.maxStudents === 999999 ? '∞' : plan.maxStudents}
            </div>
            <div className="text-slate-500">Groups</div>
            <div className="text-right text-slate-300">
              {plan.maxGroups === 999999 ? '∞' : plan.maxGroups}
            </div>
            <div className="text-slate-500">Rooms</div>
            <div className="text-right text-slate-300">
              {plan.maxRooms === 999999 ? '∞' : plan.maxRooms}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
