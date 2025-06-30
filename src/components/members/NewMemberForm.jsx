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
import { CalendarIcon, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { CountryCodeSelect } from '../data/CountryCodeSelect'
import { countryCodes } from '../data/CountryCodes'

export function NewMemberForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState(new Date())
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    phoneCountryCode: '+233',
    plan_id: null,
    start_date: new Date().toISOString(),
    payment_method: 'cash',
    amount_paid: '',
    transaction_id: '',
    payment_notes: ''
  })
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')

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

  useEffect(() => {
    if (formData.plan_id) {
      const plan = plans.find(p => p.id == formData.plan_id)
      setSelectedPlan(plan)
      setFormData(prev => ({
        ...prev,
        amount_paid: plan?.price?.toString() || ''
      }))
    } else {
      setSelectedPlan(null)
      setFormData(prev => ({ ...prev, amount_paid: '' }))
    }
  }, [formData.plan_id, plans])

  const validateEmail = (email) => {
    if (!email) {
      setEmailError('Email is required')
      return false
    }
    
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!re.test(email)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    
    setEmailError('')
    return true
  }

  const validatePhone = (phone) => {
    if (!phone) {
      setPhoneError('Phone number is required')
      return false
    }
    
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 9) {
      setPhoneError('Phone number must be at least 9 digits')
      return false
    }
    
    setPhoneError('')
    return true
  }

  const handleEmailChange = (e) => {
    const email = e.target.value
    setFormData({...formData, email})
    validateEmail(email)
  }

  const handlePhoneChange = (e) => {
    const phone = e.target.value.replace(/[^\d]/g, '')
    setFormData({...formData, phone})
    validatePhone(phone)
  }

  const handleCountryCodeChange = (value) => {
    setFormData({...formData, phoneCountryCode: value})
  }

  const validateForm = () => {
    const isEmailValid = validateEmail(formData.email)
    const isPhoneValid = validatePhone(formData.phone)
    
    if (formData.plan_id && !formData.amount_paid) {
      toast.error('Payment amount is required when selecting a plan')
      return false
    }

    return isEmailValid && isPhoneValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      const fullPhoneNumber = `${formData.phoneCountryCode}${formData.phone.replace(/\D/g, '')}`
      const amount = parseFloat(formData.amount_paid) || 0

      // 1. Create member
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert([{
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: fullPhoneNumber
        }])
        .select()
        .single()

      if (memberError) throw memberError

      let subscriptionId = null

      // 2. Create subscription if plan selected
      if (formData.plan_id) {
        const plan = plans.find(p => p.id == formData.plan_id)
        const endDate = new Date(new Date(date).setDate(date.getDate() + (plan.duration_days || 0)))

        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .insert([{
            member_id: member.id,
            plan_id: formData.plan_id,
            start_date: date.toISOString(),
            end_date: endDate?.toISOString(),
            remaining_sessions: plan.is_unlimited_sessions ? 9999 : plan.session_count,
            is_active: true
          }])
          .select()
          .single()

        if (subError) throw subError
        subscriptionId = subscription.id

        // 3. Record payment if amount > 0
        if (amount > 0) {
          const { error: paymentError } = await supabase
            .from('payments')
            .insert([{
              subscription_id: subscriptionId,
              amount: amount,
              payment_date: new Date().toISOString(),
              payment_method: formData.payment_method,
              transaction_id: formData.transaction_id || null,
              notes: formData.payment_notes || null
            }])

          if (paymentError) throw paymentError
        }
      }

      toast.success('Member registered successfully!')
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
        {/* Personal Info Fields */}
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
            onChange={handleEmailChange}
            required
            placeholder="example@domain.com"
          />
          {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <div className="flex gap-2">
            <CountryCodeSelect
              value={formData.phoneCountryCode}
              onChange={handleCountryCodeChange}
              countryCodes={countryCodes}
            />
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              required
              placeholder="e.g., 0244123456"
            />
          </div>
          {phoneError && <p className="text-sm text-red-500 mt-1">{phoneError}</p>}
        </div>

        {/* Membership Plan Selection */}
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

        {/* Payment Section - Only shown when plan is selected */}
        {formData.plan_id && (
          <>
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

            <div className="sm:col-span-2 border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="h-5 w-5" />
                <h3 className="font-medium">Payment Information</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="amount_paid">Amount Paid (GHS) *</Label>
                  <Input
                    id="amount_paid"
                    type="number"
                    value={formData.amount_paid}
                    onChange={(e) => setFormData({...formData, amount_paid: e.target.value})}
                    required
                    min="0"
                    step="0.01"
                  />
                  {selectedPlan && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Plan price: GHS {selectedPlan.price}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="payment_method">Payment Method *</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({...formData, payment_method: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.payment_method !== 'cash' && (
                  <div className="sm:col-span-2">
                    <Label htmlFor="transaction_id">Transaction ID/Reference</Label>
                    <Input
                      id="transaction_id"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({...formData, transaction_id: e.target.value})}
                      placeholder="e.g., MTN123456789"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <Label htmlFor="payment_notes">Payment Notes</Label>
                  <Input
                    id="payment_notes"
                    value={formData.payment_notes}
                    onChange={(e) => setFormData({...formData, payment_notes: e.target.value})}
                    placeholder="Any additional payment details"
                  />
                </div>
              </div>
            </div>
          </>
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