'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function EmailTemplates() {
  const [templates, setTemplates] = useState({
    welcome: '',
    session_reminder: '',
    membership_expiry: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')

      if (error) throw error
      
      const formattedData = data.reduce((acc, template) => {
        acc[template.template_name] = template.content
        return acc
      }, { welcome: '', session_reminder: '', membership_expiry: '' })

      setTemplates(formattedData)
    } catch (error) {
      toast.error(error.message || 'Error')
    }
  }

  const handleSave = async (templateName) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('email_templates')
        .upsert([{
          template_name: templateName,
          content: templates[templateName]
        }], { onConflict: 'template_name' })

      if (error) throw error
      toast.error('Template saved successfully')
    } catch (error) {
      toast.error(error.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <Tabs defaultValue="welcome">
        <TabsList>
          <TabsTrigger value="welcome">Welcome Email</TabsTrigger>
          <TabsTrigger value="session_reminder">Session Reminder</TabsTrigger>
          <TabsTrigger value="membership_expiry">Membership Expiry</TabsTrigger>
        </TabsList>

        <TabsContent value="welcome" className="mt-6">
          <div className="space-y-4">
            <Label>Welcome Email Template</Label>
            <Textarea
              className="min-h-[200px]"
              value={templates.welcome}
              onChange={(e) => setTemplates({...templates, welcome: e.target.value})}
              placeholder="Welcome {{member_name}} to our gym!..."
            />
            <div className="flex justify-end">
              <Button onClick={() => handleSave('welcome')} disabled={loading}>
                {loading ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="session_reminder" className="mt-6">
          <div className="space-y-4">
            <Label>Session Reminder Template</Label>
            <Textarea
              className="min-h-[200px]"
              value={templates.session_reminder}
              onChange={(e) => setTemplates({...templates, session_reminder: e.target.value})}
              placeholder="Hi {{member_name}}, you have {{remaining_sessions}} sessions left..."
            />
            <div className="flex justify-end">
              <Button onClick={() => handleSave('session_reminder')} disabled={loading}>
                {loading ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="membership_expiry" className="mt-6">
          <div className="space-y-4">
            <Label>Membership Expiry Template</Label>
            <Textarea
              className="min-h-[200px]"
              value={templates.membership_expiry}
              onChange={(e) => setTemplates({...templates, membership_expiry: e.target.value})}
              placeholder="Dear {{member_name}}, your membership expires on {{expiry_date}}..."
            />
            <div className="flex justify-end">
              <Button onClick={() => handleSave('membership_expiry')} disabled={loading}>
                {loading ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}