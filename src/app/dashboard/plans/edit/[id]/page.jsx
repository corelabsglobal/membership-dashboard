import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PlanForm } from '@/components/plans/PlanForm'
import { supabase } from '@/lib/supabase'

export default async function EditPlanPage({ params }) {
  const { data: plan } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('id', params.id)
    .single()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Edit Membership Plan</h1>
        <PlanForm plan={plan} />
      </div>
    </DashboardLayout>
  )
}