import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ReportsOverview } from '@/components/reports/ReportsOverview'

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <ReportsOverview />
      </div>
    </DashboardLayout>
  )
}