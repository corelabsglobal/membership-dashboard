import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SettingsTabs } from '@/components/settings/SettingsTabs'
import { checkAdminAccess } from '@/lib/auth'

export default async function SettingsPage() {
  const { isAdmin } = await checkAdminAccess()
  
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <SettingsTabs />
      </div>
    </DashboardLayout>
  )
}