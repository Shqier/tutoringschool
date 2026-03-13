// ============================================
// SUPER ADMIN DASHBOARD
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

// Mock data - replace with actual API calls
const stats = {
  totalTenants: 156,
  activeTenants: 142,
  trialTenants: 23,
  suspendedTenants: 4,
  totalUsers: 2847,
  mrr: 12450,
  growthRate: 12.5,
};

const recentActivity = [
  { id: 1, action: 'New tenant signup', tenant: 'Cairo Academy', time: '2 min ago', type: 'success' },
  { id: 2, action: 'Plan upgraded', tenant: 'London School', time: '15 min ago', type: 'info' },
  { id: 3, action: 'Payment failed', tenant: 'Paris Institute', time: '1 hour ago', type: 'warning' },
  { id: 4, action: 'Tenant suspended', tenant: 'Test School', time: '3 hours ago', type: 'error' },
];

export default function SuperAdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tenants"
          value={stats.totalTenants}
          icon={Building2}
          trend="+5 this week"
          trendUp={true}
        />
        <StatCard
          title="Active Users"
          value={stats.totalUsers}
          icon={Users}
          trend="+128 this month"
          trendUp={true}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.mrr.toLocaleString()}`}
          icon={CreditCard}
          trend={`+${stats.growthRate}%`}
          trendUp={true}
        />
        <StatCard
          title="Trial Conversion"
          value="68%"
          icon={TrendingUp}
          trend="+3% vs last month"
          trendUp={true}
        />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard
          title="Active"
          value={stats.activeTenants}
          icon={CheckCircle2}
          color="green"
        />
        <StatusCard
          title="In Trial"
          value={stats.trialTenants}
          icon={Clock}
          color="amber"
        />
        <StatusCard
          title="Suspended"
          value={stats.suspendedTenants}
          icon={AlertCircle}
          color="red"
        />
        <StatusCard
          title="Churn Risk"
          value={8}
          icon={AlertCircle}
          color="orange"
        />
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-amber-500' :
                    activity.type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-white">{activity.action}</p>
                    <p className="text-xs text-slate-400">{activity.tenant}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Components
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <Icon className="h-5 w-5 text-amber-500" />
          </div>
        </div>
        <p className={`text-xs mt-4 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}

function StatusCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType;
  color: 'green' | 'amber' | 'red' | 'orange';
}) {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
        <Icon className="h-5 w-5 opacity-60" />
      </div>
    </div>
  );
}
