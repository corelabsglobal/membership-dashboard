'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserManagement } from './UserManagement'
import { SystemSettings } from './SystemSettings'
import { EmailTemplates } from './EmailTemplates'

export function SettingsTabs() {
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList>
        <TabsTrigger value="users">User Management</TabsTrigger>
        <TabsTrigger value="system">System Settings</TabsTrigger>
        <TabsTrigger value="email">Email Templates</TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="mt-6">
        <UserManagement />
      </TabsContent>

      <TabsContent value="system" className="mt-6">
        <SystemSettings />
      </TabsContent>

      <TabsContent value="email" className="mt-6">
        <EmailTemplates />
      </TabsContent>
    </Tabs>
  )
}