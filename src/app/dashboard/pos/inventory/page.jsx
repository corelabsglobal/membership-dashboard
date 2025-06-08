"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function InventoryPage() {
  const [inventory, setInventory] = useState([])
  const [newItem, setNewItem] = useState({
    name: '',
    size: '',
    quantity: 1
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('skate_inventory')
        .select('*')
        .order('size', { ascending: true })
      
      if (error) throw error
      setInventory(data || [])
    } catch (error) {
      toast.error("Error fetching inventory")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from('skate_inventory')
        .insert([{
          name: newItem.name,
          size: parseFloat(newItem.size),
          quantity: parseInt(newItem.quantity),
          is_available: true
        }])
      
      if (error) throw error
      
      toast.success("Item added successfully")
      setNewItem({ name: '', size: '', quantity: 1 })
      fetchInventory()
    } catch (error) {
      toast.error("Error adding item")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAvailability = async (id, currentStatus) => {
    try {
      setIsUpdating(true)
      const { error } = await supabase
        .from('skate_inventory')
        .update({ is_available: !currentStatus })
        .eq('id', id)
      
      if (error) throw error
      fetchInventory()
      toast.success(`Item marked ${!currentStatus ? 'available' : 'unavailable'}`)
    } catch (error) {
      toast.error("Error updating item")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:block fixed h-full">
        <Sidebar />
      </div>
      
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <div className="sticky top-0 z-10">
          <Topbar />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newItem.name}
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                        required
                        placeholder="Add Shin Pads, Helmets, etc"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="size">Size</Label>
                      <Input
                        id="size"
                        type="number"
                        step="0.5"
                        value={newItem.size}
                        onChange={(e) => setNewItem({...newItem, size: e.target.value})}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Inventory'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : inventory.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-gray-100">
                        <TableRow>
                          <TableHead className="w-[25%]">Name</TableHead>
                          <TableHead className="w-[15%]">Size</TableHead>
                          <TableHead className="w-[15%]">Quantity</TableHead>
                          <TableHead className="w-[20%]">Status</TableHead>
                          <TableHead className="w-[25%]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.size}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.is_available 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.is_available ? 'Available' : 'Unavailable'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toggleAvailability(item.id, item.is_available)}
                                disabled={isUpdating}
                              >
                                {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500 text-lg">No inventory items found</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={fetchInventory}
                      disabled={isLoading}
                    >
                      Refresh
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}