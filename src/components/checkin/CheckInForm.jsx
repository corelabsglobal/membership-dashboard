'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'

export function CheckInForm() {
  const [searchTerm, setSearchTerm] = useState('')
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  // Debounce search to avoid too many requests
  const debouncedSearch = useCallback(async (term) => {
    if (!term.trim()) {
      setMembers([])
      return
    }

    setSearchLoading(true)
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*, subscriptions(*, membership_plans(*))')
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
        .limit(10)
      
      if (error) throw error
      
      setMembers(data || [])
    } catch (error) {
      console.error('Error searching members:', error)
      toast.error('Failed to search for members')
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(searchTerm)
    }, 300) // 300ms debounce delay

    return () => clearTimeout(timer)
  }, [searchTerm, debouncedSearch])

  const handleSelectMember = (member) => {
    setSelectedMember(member)
    setSearchTerm(`${member.first_name} ${member.last_name}`)
    setMembers([]) // Clear search results
    
    // Find active subscription
    const activeSub = member.subscriptions?.find(sub => {
      const isActive = sub.is_active
      const isUnlimitedSessions = sub.membership_plans?.is_unlimited_sessions
      const hasSessions = isUnlimitedSessions || sub.remaining_sessions > 0
      const notExpired = sub.end_date ? new Date(sub.end_date) > new Date() : true
      
      return isActive && hasSessions && notExpired
    })
    
    setSubscription(activeSub)
  }

  const handleCheckIn = async () => {
    if (!subscription) return
    
    setLoading(true)
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

      // Record the session
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert([{
          subscription_id: subscription.id,
          member_id: selectedMember.id,
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

      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberName: `${selectedMember.first_name} ${selectedMember.last_name}`,
          email: selectedMember.email,
          planName: subscription.membership_plans?.name,
          remainingSessions: isUnlimitedSessions ? null : subscription.remaining_sessions - 1,
          isUnlimited: isUnlimitedSessions
        }),
      })

      if (!emailResponse.ok) {
        throw new Error('Failed to send email')
      }
      
      toast.success(
        isUnlimitedSessions 
          ? 'Check-in successful (Unlimited sessions)' 
          : `Check-in successful. ${subscription.remaining_sessions - 1} sessions remaining.`
      )
      
      // Reset form after successful check-in
      setSelectedMember(null)
      setSearchTerm('')
    } catch (error) {
      console.error('Error checking in:', error)
      toast.error('Failed to record check-in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Search by name, email, or phone"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setSelectedMember(null)
            setSubscription(null)
          }}
          className="pr-10" // Add padding for loading indicator
        />
        
        {/* Search loading indicator */}
        {searchLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          </div>
        )}
        
        {/* Search results dropdown */}
        {members.length > 0 && !selectedMember && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
            {members.map((member) => (
              <div
                key={member.id}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => handleSelectMember(member)}
              >
                <div className="font-medium">
                  {member.first_name} {member.last_name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {member.email} | {member.phone}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedMember && (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium">
            {selectedMember.first_name} {selectedMember.last_name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedMember.email} | {selectedMember.phone}
          </p>
          
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
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Mark Attendance'}
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