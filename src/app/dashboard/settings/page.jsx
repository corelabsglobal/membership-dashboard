"use client"

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SettingsTabs } from '@/components/settings/SettingsTabs'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [isAdmin, setIsAdmin] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuthAndAdminStatus = async () => {
      try {
        setIsLoading(true)
        
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)

        if (!session) {
          setIsAdmin(false)
          return
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single()

        if (error || !profile) {
          console.error('Error fetching profile:', error)
          setIsAdmin(false)
          return
        }

        setIsAdmin(profile.is_admin || false)
      } catch (error) {
        console.error('Error in auth check:', error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndAdminStatus()
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  // Access denied state
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

  // Admin access granted
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <SettingsTabs />
      </div>
    </DashboardLayout>
  )
}