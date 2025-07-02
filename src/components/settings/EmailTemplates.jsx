'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { EmailPreview } from './EmailPreview'

export function EmailTemplates() {
  const [templates, setTemplates] = useState({
    welcome: '',
    session_reminder: '',
    membership_expiry: '',
    promo: ''
  })
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [activeTab, setActiveTab] = useState('welcome')

  useEffect(() => {
    fetchTemplates()
    fetchMembers()
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
      }, { welcome: '', session_reminder: '', membership_expiry: '', promo: '' })

      setTemplates(formattedData)
    } catch (error) {
      toast.error(error.message || 'Error fetching templates')
    }
  }

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, email')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers(data)
    } catch (error) {
      toast.error(error.message || 'Error fetching members')
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
      toast.success('Template saved successfully')
    } catch (error) {
      toast.error(error.message || 'Error saving template')
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmails = async () => {
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member')
      return
    }

    if (!emailSubject) {
      toast.error('Please enter an email subject')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/email/send-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateType: activeTab,
          memberIds: selectedMembers,
          subject: emailSubject,
          content: templates[activeTab]
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Failed to send emails')
      
      toast.success(`Emails sent successfully to ${selectedMembers.length} members`)
      setSelectedMembers([])
    } catch (error) {
      toast.error(error.message || 'Error sending emails')
    } finally {
      setLoading(false)
    }
  }

  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const selectAllMembers = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(filteredMembers.map(m => m.id))
    }
  }

  const filteredMembers = members.filter(member => 
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getAutoFilledTemplate = async (templateName) => {
    try {
      // For session reminders, find members with <= 3 sessions remaining
      if (templateName === 'session_reminder') {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('member_id, remaining_sessions, members(first_name, last_name)')
          .gt('remaining_sessions', 0)
          .lte('remaining_sessions', 3)
          .eq('is_active', true)

        if (error) throw error
        
        setSelectedMembers(data.map(item => item.member_id))
        const names = data.map(item => `${item.members.first_name} ${item.members.last_name}`).join(', ')
        toast.success(`Auto-selected ${data.length} members with low session count`)
      }
      
      // For membership expiry, find members with expiring memberships (within 7 days)
      if (templateName === 'membership_expiry') {
        const today = new Date()
        const nextWeek = new Date()
        nextWeek.setDate(today.getDate() + 7)
        
        const { data, error } = await supabase
          .from('subscriptions')
          .select('member_id, end_date, members(first_name, last_name)')
          .gte('end_date', today.toISOString())
          .lte('end_date', nextWeek.toISOString())
          .eq('is_active', true)

        if (error) throw error
        
        setSelectedMembers(data.map(item => item.member_id))
        const names = data.map(item => `${item.members.first_name} ${item.members.last_name}`).join(', ')
        toast.success(`Auto-selected ${data.length} members with expiring memberships`)
      }
    } catch (error) {
      toast.error(error.message || 'Error auto-filling members')
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <Tabs defaultValue="welcome" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="welcome">Welcome Email</TabsTrigger>
          <TabsTrigger value="session_reminder">Session Reminder</TabsTrigger>
          <TabsTrigger value="membership_expiry">Membership Expiry</TabsTrigger>
          <TabsTrigger value="promo">Promotional Email</TabsTrigger>
        </TabsList>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {activeTab === 'welcome' && (
              <TabsContent value="welcome" className="space-y-4">
                <Label>Welcome Email Template</Label>
                <Textarea
                  className="min-h-[200px]"
                  value={templates.welcome}
                  onChange={(e) => setTemplates({...templates, welcome: e.target.value})}
                  placeholder="Welcome {{member_name}} to our gym!..."
                />
                <EmailPreview 
                  templateType={activeTab}
                  content={templates.welcome}
                  subject={emailSubject}
                />
              </TabsContent>
            )}

            {activeTab === 'session_reminder' && (
              <TabsContent value="session_reminder" className="space-y-4">
                <Label>Session Reminder Template</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mb-2"
                  onClick={() => getAutoFilledTemplate('session_reminder')}
                >
                  Auto-select members with ≤3 sessions
                </Button>
                <EmailPreview 
                  templateType={activeTab}
                  content={templates.session_reminder}
                  subject={emailSubject}
                />
                <Textarea
                  className="min-h-[200px]"
                  value={templates.session_reminder}
                  onChange={(e) => setTemplates({...templates, session_reminder: e.target.value})}
                  placeholder="Hi {{member_name}}, you have {{remaining_sessions}} sessions left..."
                />
              </TabsContent>
            )}

            {activeTab === 'membership_expiry' && (
              <TabsContent value="membership_expiry" className="space-y-4">
                <Label>Membership Expiry Template</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mb-2"
                  onClick={() => getAutoFilledTemplate('membership_expiry')}
                >
                  Auto-select expiring memberships
                </Button>
                <EmailPreview 
                  templateType={activeTab}
                  content={templates.membership_expiry}
                  subject={emailSubject}
                />
                <Textarea
                  className="min-h-[200px]"
                  value={templates.membership_expiry}
                  onChange={(e) => setTemplates({...templates, membership_expiry: e.target.value})}
                  placeholder="Dear {{member_name}}, your membership expires on {{expiry_date}}..."
                />
              </TabsContent>
            )}

            {activeTab === 'promo' && (
              <TabsContent value="promo" className="space-y-4">
                <Label>Promotional Email Template</Label>
                <EmailPreview 
                  templateType={activeTab}
                  content={templates.promo}
                  subject={emailSubject}
                />
                <Textarea
                  className="min-h-[200px]"
                  value={templates.promo}
                  onChange={(e) => setTemplates({...templates, promo: e.target.value})}
                  placeholder="Exciting news {{member_name}}! We have a special offer..."
                />
              </TabsContent>
            )}

            <div className="space-y-2">
              <Label>Email Subject</Label>
              <Input 
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                onClick={() => handleSave(activeTab)} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Saving...' : 'Save Template'}
              </Button>
              <Button 
                onClick={handleSendEmails} 
                disabled={loading || selectedMembers.length === 0}
              >
                {loading ? 'Sending...' : `Send to ${selectedMembers.length} members`}
              </Button>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <Label>Select Members</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={selectAllMembers}
              >
                {selectedMembers.length === filteredMembers.length ? 'Deselect all' : 'Select all'}
              </Button>
            </div>
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members found</p>
              ) : (
                filteredMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => toggleMemberSelection(member.id)}
                    />
                    <label htmlFor={`member-${member.id}`} className="text-sm">
                      {member.first_name} {member.last_name} ({member.email})
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  )
}