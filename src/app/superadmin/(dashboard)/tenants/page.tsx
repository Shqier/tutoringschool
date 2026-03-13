// ============================================
// SUPER ADMIN - TENANTS LIST
// ============================================

import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Building2,
  Users,
  CreditCard
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// This would be fetched from API in production
async function getTenants() {
  // Mock data for now
  return [
    {
      id: '1',
      name: 'Cairo Academy',
      subdomain: 'cairo-academy',
      plan: { name: 'Growth', color: 'blue' },
      status: 'active',
      users: 45,
      teachers: 12,
      students: 234,
      mrr: 79,
      trialEndsAt: null,
    },
    {
      id: '2',
      name: 'London School',
      subdomain: 'london-school',
      plan: { name: 'Enterprise', color: 'purple' },
      status: 'active',
      users: 128,
      teachers: 45,
      students: 892,
      mrr: 199,
      trialEndsAt: null,
    },
    {
      id: '3',
      name: 'Paris Institute',
      subdomain: 'paris-institute',
      plan: { name: 'Starter', color: 'green' },
      status: 'trial',
      users: 8,
      teachers: 3,
      students: 45,
      mrr: 0,
      trialEndsAt: '2024-03-15',
    },
    {
      id: '4',
      name: 'Dubai Learning Center',
      subdomain: 'dubai-learning',
      plan: { name: 'Growth', color: 'blue' },
      status: 'past_due',
      users: 23,
      teachers: 8,
      students: 156,
      mrr: 79,
      trialEndsAt: null,
    },
  ];
}

export default async function TenantsPage() {
  const tenants = await getTenants();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants</h1>
          <p className="text-slate-400">Manage all organizations on your platform</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950">
          <Plus className="h-4 w-4 mr-2" />
          New Tenant
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search tenants..."
                className="pl-10 bg-slate-950 border-slate-800 text-white"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px] bg-slate-950 border-slate-800 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px] bg-slate-950 border-slate-800 text-white">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Organization</TableHead>
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Users</TableHead>
                <TableHead className="text-slate-400">MRR</TableHead>
                <TableHead className="text-slate-400">Trial Ends</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id} className="border-slate-800">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{tenant.name}</p>
                        <p className="text-sm text-slate-500">{tenant.subdomain}.busala.com</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${tenant.plan.color === 'green' ? 'border-green-500/30 text-green-400 bg-green-500/10' : ''}
                        ${tenant.plan.color === 'blue' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : ''}
                        ${tenant.plan.color === 'purple' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' : ''}
                      `}
                    >
                      {tenant.plan.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tenant.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-sm text-slate-300">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        {tenant.users}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-300">
                      {tenant.mrr > 0 ? `$${tenant.mrr}` : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-400">
                      {tenant.trialEndsAt || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                        <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                          Impersonate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                          Edit Plan
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-800" />
                        <DropdownMenuItem className="text-red-400 focus:bg-slate-800 focus:text-red-400">
                          Suspend
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {tenants.length} of {tenants.length} tenants
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="bg-slate-900 border-slate-800 text-slate-400">
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled className="bg-slate-900 border-slate-800 text-slate-400">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    active: 'bg-green-500/10 text-green-400 border-green-500/30',
    trial: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    past_due: 'bg-red-500/10 text-red-400 border-red-500/30',
    suspended: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  const labels = {
    active: 'Active',
    trial: 'Trial',
    past_due: 'Past Due',
    suspended: 'Suspended',
  };

  return (
    <Badge 
      variant="outline" 
      className={styles[status as keyof typeof styles] || styles.suspended}
    >
      {labels[status as keyof typeof labels] || status}
    </Badge>
  );
}
