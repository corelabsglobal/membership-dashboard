import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MemberTable } from '@/components/members/MemberTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function MembersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Members</h1>
          <Link href="/dashboard/members/new">
            <Button>Add Member</Button>
          </Link>
        </div>
        <MemberTable />
      </div>
    </DashboardLayout>
  )
}