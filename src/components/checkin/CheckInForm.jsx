import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

export function CheckInForm() {
  const [searchTerm, setSearchTerm] = useState('')
  const [member, setMember] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setLoading(true)
    try {
      // Search for member by name, email, or phone
      const { data, error } = await supabase
        .from('members')
        .select('*, subscriptions(*, membership_plans(*))')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(1)
      
      if (error) throw error
      
      if (data.length === 0) {
        toast({
          title: 'Member not found',
          description: 'No member matches your search',
          variant: 'destructive'
        })
        return
      }
      
      const foundMember = data[0]
      setMember(foundMember)
      
      // Find active subscription
      const activeSub = foundMember.subscriptions?.find(
        sub => sub.is_active && new Date(sub.end_date) > new Date()
      )
      
      setSubscription(activeSub)
      
      if (!activeSub) {
        toast({
          title: 'No active membership',
          description: 'This member does not have an active subscription',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error searching member:', error)
      toast({
        title: 'Error',
        description: 'Failed to search for member',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!subscription || subscription.remaining_sessions <= 0) return
    
    try {
      // Deduct session
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ 
          remaining_sessions: subscription.remaining_sessions - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)
      
      if (updateError) throw updateError
      
      // Record session
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert([{
          subscription_id: subscription.id,
          check_in_time: new Date().toISOString()
        }])
      
      if (sessionError) throw sessionError
      
      toast({
        title: 'Check-in successful',
        description: `Session recorded. ${subscription.remaining_sessions - 1} sessions remaining.`,
      })
      
      // Refresh subscription data
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscription.id)
        .single()
      
      setSubscription(data)
    } catch (error) {
      console.error('Error checking in:', error)
      toast({
        title: 'Error',
        description: 'Failed to record check-in',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search by name, email, or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
                <p>{subscription.membership_plans?.name}</p>
              </div>
              <div>
                <Label>Remaining Sessions</Label>
                <p>{subscription.remaining_sessions}</p>
              </div>
              <div>
                <Label>Expires</Label>
                <p>{new Date(subscription.end_date).toLocaleDateString()}</p>
              </div>
              
              <Button 
                onClick={handleCheckIn} 
                disabled={subscription.remaining_sessions <= 0}
                className="mt-4"
              >
                Mark Attendance
              </Button>
              
              {subscription.remaining_sessions <= 0 && (
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