'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function EditMemberForm() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })
  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch member data
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('id', id)
          .single()

        if (memberError) throw memberError

        // Fetch active subscription if exists
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*, membership_plans(*)')
          .eq('member_id', id)
          .eq('is_active', true)
          .maybeSingle()

        if (subscriptionError) throw subscriptionError

        // Fetch available plans
        const { data: plansData, error: plansError } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true })

        if (plansError) throw plansError

        setFormData({
          first_name: memberData.first_name,
          last_name: memberData.last_name,
          email: memberData.email,
          phone: memberData.phone,
        })
        setSubscription(subscriptionData)
        setPlans(plansData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load member data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const validateForm = () => {
    if (!formData.email) {
      toast.error('Email is required')
      return false
    }

    if (!formData.phone) {
      toast.error('Phone number is required')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return false
    }

    if (formData.phone.length < 9) {
      toast.error('Please enter a valid phone number (at least 9 digits)')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      // Format phone number (remove any non-digit characters)
      const formattedPhone = formData.phone.replace(/\D/g, '')

      // Update member
      const { error } = await supabase
        .from('members')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formattedPhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Member updated successfully!')
      router.push('/dashboard/members')
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error(error.message || 'Failed to update member')
    } finally {
      setLoading(false)
    }
  }

  const handlePlanChange = async (planId) => {
    if (!planId) return

    try {
      setLoading(true)
      const plan = plans.find(p => p.id == planId)
      
      // Deactivate current subscription if exists
      if (subscription) {
        const { error: deactivateError } = await supabase
          .from('subscriptions')
          .update({ is_active: false })
          .eq('id', subscription.id)

        if (deactivateError) throw deactivateError
      }

      // Create new subscription
      const startDate = new Date()
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + (plan.duration_days || 0))

      const { error: createError } = await supabase
        .from('subscriptions')
        .insert([{
          member_id: id,
          plan_id: plan.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          remaining_sessions: plan.is_unlimited_sessions ? 9999 : plan.session_count,
          is_active: true
        }])

      if (createError) throw createError

      // Refresh subscription data
      const { data } = await supabase
        .from('subscriptions')
        .select('*, membership_plans(*)')
        .eq('member_id', id)
        .eq('is_active', true)
        .single()

      setSubscription(data)
      toast.success('Membership plan updated successfully!')
    } catch (error) {
      console.error('Error updating plan:', error)
      toast.error('Failed to update membership plan')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="py-4">Loading member data...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            placeholder="example@domain.com"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
            placeholder="e.g., 0244123456"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Current Membership Plan</Label>
          {subscription ? (
            <div className="border rounded-md p-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {subscription.membership_plans?.name}
                </span>
                <span className="text-sm">
                  {subscription.membership_plans?.is_unlimited_sessions ? (
                    <span className="text-green-600">Unlimited sessions</span>
                  ) : (
                    `${subscription.remaining_sessions} sessions remaining`
                  )}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {new Date(subscription.start_date).toLocaleDateString()} -{' '}
                {subscription.end_date 
                  ? new Date(subscription.end_date).toLocaleDateString()
                  : 'No end date'}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active membership</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <Label>Change Membership Plan</Label>
          <Select onValueChange={handlePlanChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a new plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id.toString()}>
                  <div className="flex items-center justify-between">
                    <span>{plan.name} - GHS {plan.price}</span>
                    <span className="text-sm text-gray-500">
                      {plan.is_unlimited_sessions 
                        ? 'Unlimited sessions' 
                        : `${plan.session_count} sessions`}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/members')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}