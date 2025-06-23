import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { CheckInForm } from '@/components/checkin/CheckInForm'
import { RecentActivity } from '@/components/dashboard/RecentActivity'

export default function CheckInPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <h1 className="text-2xl font-bold">Member Check-In</h1>
            <CheckInForm />
          </div>
          <div className="md:w-1/3">
            <RecentActivity />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}