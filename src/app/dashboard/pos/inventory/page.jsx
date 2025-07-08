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
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function InventoryPage() {
  const [inventory, setInventory] = useState([])
  const [newItem, setNewItem] = useState({
    name: '',
    size: '',
    quantity: 1
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

  useEffect(() => {
    fetchInventory()
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

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

  const handleDeleteClick = (item) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    
    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from('skate_inventory')
        .delete()
        .eq('id', itemToDelete.id)
      
      if (error) throw error
      
      toast.success("Item deleted successfully")
      fetchInventory()
    } catch (error) {
      toast.error("Error deleting item")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
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
                            <TableCell className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="w-32"
                                onClick={() => toggleAvailability(item.id, item.is_available)}
                                disabled={isUpdating}
                              >
                                {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="w-10 p-0"
                                onClick={() => handleDeleteClick(item)}
                                disabled={isUpdating || isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the inventory item: <strong>{itemToDelete?.name}</strong> (Size: {itemToDelete?.size}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}