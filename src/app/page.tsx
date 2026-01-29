import {
  TopNav,
  SidebarNav,
  AdminOverviewCard,
  LessonsList,
  ResourceUtilizationCard,
  GroupsLessonsTable,
  TeacherLoadCard,
  QuickActionsCard,
  AnnouncementsCard,
} from '@/components/dashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen busala-bg-gradient">
      {/* Top Navigation */}
      <TopNav />

      {/* Sidebar */}
      <SidebarNav />

      {/* Main Content */}
      <main className="ml-[240px] pt-[72px]">
        <div className="p-6 lg:p-8 space-y-6">
          {/* Row 1: Admin Overview */}
          <AdminOverviewCard />

          {/* Row 2: Today's Lessons + Resource Utilization */}
          <div className="grid grid-cols-12 gap-6">
            {/* Today's Lessons - 8 columns */}
            <div className="col-span-12 lg:col-span-8 h-[320px]">
              <LessonsList />
            </div>

            {/* Resource Utilization - 4 columns */}
            <div className="col-span-12 lg:col-span-4 h-[320px]">
              <ResourceUtilizationCard />
            </div>
          </div>

          {/* Row 3: Groups Table + Right Stack */}
          <div className="grid grid-cols-12 gap-6">
            {/* Groups & Lessons Table - 8 columns */}
            <div className="col-span-12 lg:col-span-8 h-[360px]">
              <GroupsLessonsTable />
            </div>

            {/* Right Stack - 4 columns */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              {/* Teacher Load */}
              <TeacherLoadCard />

              {/* Quick Actions */}
              <QuickActionsCard />

              {/* Announcements */}
              <AnnouncementsCard />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
