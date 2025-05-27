import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PlanForm } from '@/components/plans/PlanForm'

export default function NewPlanPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Create New Membership Plan</h1>
        <PlanForm />
      </div>
    </DashboardLayout>
  )
}