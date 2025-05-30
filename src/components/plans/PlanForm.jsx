"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function PlanForm({ plan }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    price: plan?.price || '',
    duration_days: plan?.duration_days || 30,
    session_count: plan?.session_count || 8,
    description: plan?.description || '',
    is_active: plan?.is_active ?? true,
    is_unlimited_duration: plan?.is_unlimited_duration ?? false
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSave = {
        ...formData,
        duration_days: formData.is_unlimited_duration ? 0 : Number(formData.duration_days)
      }

      if (plan) {
        const { error } = await supabase
          .from('membership_plans')
          .update(dataToSave)
          .eq('id', plan.id)
        
        if (error) throw error
        toast.success('Plan updated successfully')
      } else {
        const { error } = await supabase
          .from('membership_plans')
          .insert([dataToSave])
        
        if (error) throw error
        toast.success('New membership plan created successfully')
      }
      router.push('/dashboard/plans')
    } catch (error) {
      toast.error(error.message || 'An error occurred')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Plan Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="price">Price (GHS)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration (days)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.is_unlimited_duration ? 0 : formData.duration_days}
            onChange={(e) => {
              const value = e.target.value === '' ? 0 : Number(e.target.value);
              setFormData({...formData, duration_days: value})
            }}
            required
            disabled={formData.is_unlimited_duration}
          />
        </div>
        <div>
          <Label htmlFor="sessions">Number of Sessions</Label>
          <Input
            id="sessions"
            type="number"
            value={formData.session_count}
            onChange={(e) => setFormData({...formData, session_count: Number(e.target.value)})}
            required
          />
        </div>
        <div className="flex items-center space-x-2 sm:col-span-2">
          <Switch
            id="unlimited-duration"
            checked={formData.is_unlimited_duration}
            onCheckedChange={(checked) => setFormData({
              ...formData, 
              is_unlimited_duration: checked,
              // Reset duration to default when toggling off
              duration_days: checked ? 0 : 30
            })}
          />
          <Label htmlFor="unlimited-duration">Unlimited Duration (expires when sessions run out)</Label>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <div className="flex items-center space-x-2 sm:col-span-2">
          <Switch
            id="status"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
          />
          <Label htmlFor="status">Active Plan</Label>
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/plans')}
        >
          Cancel
        </Button>
        <Button type="submit">
          {plan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </form>
  )
}