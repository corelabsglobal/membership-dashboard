'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export function NewMemberForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(new Date())
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    plan_id: null,
    start_date: new Date().toISOString()
  })
  const [plans, setPlans] = useState([])

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true })
        
        if (error) throw error
        setPlans(data)
      } catch (error) {
        console.error('Error fetching plans:', error)
        toast.error('Failed to load membership plans')
      }
    }
    fetchPlans()
  }, [])

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
      const formattedPhone = formData.phone.replace(/\D/g, '')

      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert([{
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formattedPhone
        }])
        .select()
        .single()

      if (memberError) throw memberError

      if (formData.plan_id) {
        const plan = plans.find(p => p.id == formData.plan_id)
        
        const endDate = new Date(new Date(date).setDate(date.getDate() + (plan.duration_days || 0)))

        const { error: subError } = await supabase
          .from('subscriptions')
          .insert([{
            member_id: member.id,
            plan_id: formData.plan_id,
            start_date: date.toISOString(),
            end_date: endDate?.toISOString(),
            remaining_sessions: plan.is_unlimited_sessions ? 9999 : plan.session_count,
            is_active: true
          }])

        if (subError) throw subError
      }

      toast.success('Member added successfully!')
      router.push('/dashboard/members')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.message || 'Operation failed. Please try again.')
    } finally {
      setLoading(false)
    }
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
          <Label>Membership Plan</Label>
          <Select
            value={formData.plan_id ? formData.plan_id.toString() : undefined}
            onValueChange={(value) => setFormData({
              ...formData, 
              plan_id: value ? parseInt(value) : null
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No plan</SelectItem>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id.toString()}>
                  <div className="flex items-center justify-between">
                    <span>
                      {plan.name} - GHS {plan.price}
                    </span>
                    <span className="ml-2">
                      {plan.duration_days} days
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {plan.is_unlimited_sessions ? (
                      <span className="flex items-center">
                        <Badge variant="outline" className="mr-1">Unlimited</Badge>
                        sessions
                      </span>
                    ) : (
                      `${plan.session_count} sessions`
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {formData.plan_id && (
          <div className="sm:col-span-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
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
          {loading ? 'Registering...' : 'Register Member'}
        </Button>
      </div>
    </form>
  )
}