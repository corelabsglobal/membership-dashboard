'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function SystemSettings() {
  const [settings, setSettings] = useState({
    business_name: '',
    business_email: '',
    session_reminder: true,
    membership_expiry_notice: true,
    checkin_notification: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) setSettings(data)
    } catch (error) {
      toast.error(error.message || 'Error')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert([settings], { onConflict: 'id' })

      if (error) throw error
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error(error.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Business Information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={settings.business_name}
              onChange={(e) => setSettings({...settings, business_name: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="business_email">Business Email</Label>
            <Input
              id="business_email"
              type="email"
              value={settings.business_email}
              onChange={(e) => setSettings({...settings, business_email: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Notification Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Session Reminder Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send reminders when members have few sessions left
              </p>
            </div>
            <Switch
              checked={settings.session_reminder}
              onCheckedChange={(checked) => setSettings({...settings, session_reminder: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Membership Expiry Notices</Label>
              <p className="text-sm text-muted-foreground">
                Notify members before their membership expires
              </p>
            </div>
            <Switch
              checked={settings.membership_expiry_notice}
              onCheckedChange={(checked) => setSettings({...settings, membership_expiry_notice: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Check-in Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send notifications when members check in
              </p>
            </div>
            <Switch
              checked={settings.checkin_notification}
              onCheckedChange={(checked) => setSettings({...settings, checkin_notification: checked})}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}