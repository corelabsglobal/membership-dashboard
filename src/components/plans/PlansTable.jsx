"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'

export function PlansTable() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('membership_plans')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setPlans(data)
      } catch (error) {
        console.error('Error fetching plans:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPlans()
  }, [])

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      setPlans(plans.filter(plan => plan.id !== id))
    } catch (error) {
      console.error('Error deleting plan:', error)
    }
  }

  if (loading) return <div className="py-4">Loading plans...</div>

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Sessions</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">{plan.name}</TableCell>
              <TableCell>GHS {plan.price}</TableCell>
              <TableCell>
                {plan.is_unlimited_duration ? (
                  <Badge variant="outline">Unlimited</Badge>
                ) : (
                  `${plan.duration_days} days`
                )}
              </TableCell>
              <TableCell>{plan.session_count}</TableCell>
              <TableCell>
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Link href={`/dashboard/plans/edit/${plan.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1 text-red-500" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}