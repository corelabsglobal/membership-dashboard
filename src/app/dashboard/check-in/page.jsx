import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { CheckInForm } from '@/components/checkin/CheckInForm'

export default function CheckInPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Member Check-In</h1>
        <CheckInForm />
      </div>
    </DashboardLayout>
  )
}