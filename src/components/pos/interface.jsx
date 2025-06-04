"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

export function PosInterface() {
  const [customer, setCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    shoeSize: ''
  })
  const [skate, setSkate] = useState('')
  const [duration, setDuration] = useState(60)
  const [rate, setRate] = useState(10)
  const [availableSkates, setAvailableSkates] = useState([])
  const [shoeSizes, setShoeSizes] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Load initial data
  const loadData = async () => {
    try {
      const [{ data: skates }, { data: sizes }] = await Promise.all([
        supabase.from('skate_inventory').select('*').eq('is_available', true),
        supabase.from('shoe_sizes').select('*')
      ])
      setAvailableSkates(skates)
      setShoeSizes(sizes)
    } catch (error) {
      toast.error("Error loading data")
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // 1. Create or find customer
      let customerId
      if (customer.email) {
        const { data: existingCustomer } = await supabase
          .from('walkin_customers')
          .select('id')
          .eq('email', customer.email)
          .single()
        
        if (existingCustomer) {
          customerId = existingCustomer.id
        } else {
          const { data: newCustomer } = await supabase
            .from('walkin_customers')
            .insert([{
              first_name: customer.firstName,
              last_name: customer.lastName,
              email: customer.email,
              phone: customer.phone,
              shoe_size_id: customer.shoeSize
            }])
            .select()
            .single()
          customerId = newCustomer.id
        }
      }

      // 2. Calculate amount
      const amount = (duration / 60) * rate

      // 3. Create payment
      const { data: payment } = await supabase
        .from('payments')
        .insert([{
          amount,
          payment_method: 'cash',
          transaction_id: `POS-${Date.now()}`
        }])
        .select()
        .single()

      // 4. Create POS session
      await supabase
        .from('pos_sessions')
        .insert([{
          customer_id: customerId,
          skate_id: skate,
          duration_minutes: duration,
          amount_paid: amount,
          payment_id: payment.id
        }])

      // 5. Update skate availability
      await supabase
        .from('skate_inventory')
        .update({ is_available: false })
        .eq('id', skate)

      toast.success("Session created successfully", `Payment of $${amount.toFixed(2)} processed.`)

      // Reset form
      setCustomer({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        shoeSize: ''
      })
      setSkate('')
      setDuration(60)
      loadData()
    } catch (error) {
      toast.error("Error processing session")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Walk-In Session</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={customer.firstName}
                onChange={(e) => setCustomer({...customer, firstName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={customer.lastName}
                onChange={(e) => setCustomer({...customer, lastName: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer({...customer, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={customer.phone}
                onChange={(e) => setCustomer({...customer, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shoeSize">Shoe Size</Label>
            <Select
              value={customer.shoeSize}
              onValueChange={(value) => setCustomer({...customer, shoeSize: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shoe size" />
              </SelectTrigger>
              <SelectContent>
                {shoeSizes.map((size) => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.size} - {size.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skate">Select Skate</Label>
            <Select
              value={skate}
              onValueChange={setSkate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select available skate" />
              </SelectTrigger>
              <SelectContent>
                {availableSkates.map((skate) => (
                  <SelectItem key={skate.id} value={skate.id}>
                    {skate.name} - Size {skate.size} ({skate.quantity} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Hourly Rate ($)</Label>
              <Input
                id="rate"
                type="number"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Create Session & Process Payment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}