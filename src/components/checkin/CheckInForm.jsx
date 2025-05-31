'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'

export function CheckInForm() {
  const [searchTerm, setSearchTerm] = useState('')
  const [member, setMember] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*, subscriptions(*, membership_plans(*))')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(1)
      
      if (error) throw error
      
      if (data.length === 0) {
        toast.error('No member matches your search')
        return
      }
      
      const foundMember = data[0]
      setMember(foundMember)
      
      // Find active subscription
      const activeSub = foundMember.subscriptions?.find(sub => {
        const isActive = sub.is_active
        const isUnlimitedSessions = sub.membership_plans?.is_unlimited_sessions
        const hasSessions = isUnlimitedSessions || sub.remaining_sessions > 0
        const notExpired = sub.end_date ? new Date(sub.end_date) > new Date() : true
        
        return isActive && hasSessions && notExpired
      })
      
      setSubscription(activeSub)
      
      if (!activeSub) {
        toast.error('No active subscription found')
      }
    } catch (error) {
      console.error('Error searching member:', error)
      toast.error('Failed to search for member')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!subscription) return
    
    try {
      const isUnlimitedSessions = subscription.membership_plans?.is_unlimited_sessions
      
      // Only update remaining sessions if not unlimited
      if (!isUnlimitedSessions) {
        if (subscription.remaining_sessions <= 0) {
          toast.error('No sessions remaining')
          return
        }

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ 
            remaining_sessions: subscription.remaining_sessions - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id)
        
        if (updateError) throw updateError
      }

      // Always record the session
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert([{
          subscription_id: subscription.id,
          check_in_time: new Date().toISOString()
        }])
      
      if (sessionError) throw sessionError
      
      // Refresh subscription data if needed
      if (!isUnlimitedSessions) {
        const { data } = await supabase
          .from('subscriptions')
          .select('*, membership_plans(*)')
          .eq('id', subscription.id)
          .single()
        
        setSubscription(data)
      }
      
      toast.success(
        isUnlimitedSessions 
          ? 'Check-in successful (Unlimited sessions)' 
          : `Check-in successful. ${subscription.remaining_sessions - 1} sessions remaining.`
      )
    } catch (error) {
      console.error('Error checking in:', error)
      toast.error('Failed to record check-in')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search by name, email, or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>
      
      {member && (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium">
            {member.first_name} {member.last_name}
          </h3>
          <p className="text-sm text-gray-600">{member.email}</p>
          
          {subscription ? (
            <div className="mt-4 space-y-2">
              <div>
                <Label>Membership Plan</Label>
                <div className="flex items-center gap-2">
                  <p>{subscription.membership_plans?.name}</p>
                  {subscription.membership_plans?.is_unlimited_sessions && (
                    <Badge variant="outline">Unlimited Sessions</Badge>
                  )}
                </div>
              </div>
              <div>
                <Label>Remaining Sessions</Label>
                <p>
                  {subscription.membership_plans?.is_unlimited_sessions 
                    ? 'Unlimited' 
                    : subscription.remaining_sessions}
                </p>
              </div>
              <div>
                <Label>Expires</Label>
                <p>
                  {subscription.end_date 
                    ? new Date(subscription.end_date).toLocaleDateString()
                    : 'No end date'}
                </p>
              </div>
              
              <Button 
                onClick={handleCheckIn}
                className="mt-4"
              >
                Mark Attendance
              </Button>
              
              {!subscription.membership_plans?.is_unlimited_sessions && 
               subscription.remaining_sessions <= 0 && (
                <p className="text-sm text-red-500 mt-2">
                  No sessions remaining. Please renew membership.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-500 mt-2">
              No active membership found
            </p>
          )}
        </div>
      )}
    </div>
  )
}