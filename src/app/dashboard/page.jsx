import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { OverviewCards } from '@/components/dashboard/OverviewCards'
import { RecentActivity } from '@/components/dashboard/RecentActivity'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <OverviewCards />
        <RecentActivity />
      </div>
    </DashboardLayout>
  )
}