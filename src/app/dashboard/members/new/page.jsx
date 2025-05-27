import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NewMemberForm } from '@/components/members/NewMemberForm'

export default function NewMemberPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Register New Member</h1>
        <NewMemberForm />
      </div>
    </DashboardLayout>
  )
}