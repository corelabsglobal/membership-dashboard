"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trash2, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { usePathname } from 'next/navigation'

export default function PaymentPlansPage() {
  const [plans, setPlans] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: '',
    amount: '',
    description: '',
    is_active: true
  })
  const [editPlan, setEditPlan] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    loadPlans()
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const loadPlans = async () => {
    try {
      setIsLoading(true)
      const { data } = await supabase
        .from('payment_plans')
        .select('*')
        .order('created_at', { ascending: true })
      setPlans(data || [])
    } catch (error) {
      toast.error("Error loading payment plans")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPlan = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('payment_plans')
        .insert([{
          name: newPlan.name,
          amount: parseFloat(newPlan.amount),
          description: newPlan.description,
          is_active: newPlan.is_active
        }])

      if (error) throw error

      toast.success("Payment plan added successfully")
      setNewPlan({ name: '', amount: '', description: '', is_active: true })
      loadPlans()
    } catch (error) {
      toast.error("Error adding payment plan")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePlan = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('payment_plans')
        .update({
          name: editPlan.name,
          amount: parseFloat(editPlan.amount),
          description: editPlan.description,
          is_active: editPlan.is_active
        })
        .eq('id', editPlan.id)

      if (error) throw error

      toast.success("Payment plan updated successfully")
      setEditPlan(null)
      loadPlans()
    } catch (error) {
      toast.error("Error updating payment plan")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePlan = async (id) => {
    if (!confirm("Are you sure you want to delete this payment plan?")) return

    try {
      setIsLoading(true)
      const { error } = await supabase
        .from('payment_plans')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success("Payment plan deleted successfully")
      loadPlans()
    } catch (error) {
      toast.error("Error deleting payment plan")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (id, is_active) => {
    try {
      const { error } = await supabase
        .from('payment_plans')
        .update({ is_active: !is_active })
        .eq('id', id)

      if (error) throw error

      toast.success(`Payment plan ${is_active ? 'deactivated' : 'activated'} successfully`)
      loadPlans()
    } catch (error) {
      toast.error("Error updating payment plan status")
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 z-30 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar />
      </div>
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 md:pl-64">
        <div className="sticky top-0 z-10">
          <Topbar toggleSidebar={toggleSidebar} />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Manage Payment Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="mb-4">Add New Payment Plan</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Payment Plan</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddPlan} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Plan Name</Label>
                        <Input
                          id="name"
                          value={newPlan.name}
                          onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₵)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={newPlan.amount}
                          onChange={(e) => setNewPlan({...newPlan, amount: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                          id="description"
                          value={newPlan.description}
                          onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={newPlan.is_active}
                          onCheckedChange={(checked) => setNewPlan({...newPlan, is_active: checked})}
                        />
                        <Label htmlFor="is_active">Active</Label>
                      </div>
                      <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Adding...' : 'Add Plan'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>{plan.name}</TableCell>
                        <TableCell>₵{plan.amount.toFixed(2)}</TableCell>
                        <TableCell>{plan.description || '-'}</TableCell>
                        <TableCell>
                          <Switch
                            checked={plan.is_active}
                            onCheckedChange={() => handleToggleActive(plan.id, plan.is_active)}
                          />
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setEditPlan(plan)}>
                                <Edit size={20} />
                              </Button>
                            </DialogTrigger>
                            {editPlan && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Payment Plan</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleUpdatePlan} className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="editName">Plan Name</Label>
                                    <Input
                                      id="editName"
                                      value={editPlan.name}
                                      onChange={(e) => setEditPlan({...editPlan, name: e.target.value})}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="editAmount">Amount (₵)</Label>
                                    <Input
                                      id="editAmount"
                                      type="number"
                                      step="0.01"
                                      value={editPlan.amount}
                                      onChange={(e) => setEditPlan({...editPlan, amount: e.target.value})}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="editDescription">Description (Optional)</Label>
                                    <Input
                                      id="editDescription"
                                      value={editPlan.description || ''}
                                      onChange={(e) => setEditPlan({...editPlan, description: e.target.value})}
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id="editIsActive"
                                      checked={editPlan.is_active}
                                      onCheckedChange={(checked) => setEditPlan({...editPlan, is_active: checked})}
                                    />
                                    <Label htmlFor="editIsActive">Active</Label>
                                  </div>
                                  <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? 'Updating...' : 'Update Plan'}
                                  </Button>
                                </form>
                              </DialogContent>
                          )}
                         </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-red-600"
                          >
                            <Trash2 size={20} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}