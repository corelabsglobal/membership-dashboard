'use client'

import { EditMemberForm } from '@/components/members/EditMemberForm'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function EditMemberPage() {
  return (
    <DashboardLayout>
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Edit Member</h1>
            <EditMemberForm />
        </div>
    </DashboardLayout>
  )
}