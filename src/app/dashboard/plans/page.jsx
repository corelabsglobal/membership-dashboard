import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PlansTable } from '@/components/plans/PlansTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PlansPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Membership Plans</h1>
          <Link href="/dashboard/plans/new">
            <Button>Create New Plan</Button>
          </Link>
        </div>
        <PlansTable />
      </div>
    </DashboardLayout>
  )
}