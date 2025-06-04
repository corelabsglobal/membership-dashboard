"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('skate_inventory')
        .select('*')
        .order('size', { ascending: true })
      
      if (error) throw error
      setInventory(data)
    } catch (error) {
      toast.error("Error fetching inventory")
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
      
      setNewItem({
        name: '',
        size: '',
        quantity: 1
      })
      
      fetchInventory()
    } catch (error) {
      toast.error("Error adding item")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAvailability = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('skate_inventory')
        .update({ is_available: !currentStatus })
        .eq('id', id)
      
      if (error) throw error
      
      fetchInventory()
    } catch (error) {
      toast.error("Error updating item")
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add New Skate</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  required
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
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Skate'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
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
                    >
                      {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}