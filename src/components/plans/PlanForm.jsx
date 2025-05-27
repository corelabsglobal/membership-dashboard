import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export function PlanForm({ plan, onSuccess }) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    price: plan?.price || '',
    duration_days: plan?.duration_days || 30,
    session_count: plan?.session_count || 8,
    description: plan?.description || '',
    is_active: plan?.is_active || true
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (plan) {
        // Update existing plan
        const { error } = await supabase
          .from('membership_plans')
          .update(formData)
          .eq('id', plan.id)
      } else {
        // Create new plan
        const { error } = await supabase
          .from('membership_plans')
          .insert([formData])
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving plan:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Plan Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      <Button type="submit">Save Plan</Button>
    </form>
  )
}