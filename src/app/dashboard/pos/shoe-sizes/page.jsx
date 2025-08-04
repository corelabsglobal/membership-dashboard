"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Trash2, PlusCircle, RefreshCw } from 'lucide-react'

export default function ShoeSizesPage() {
  const [sizes, setSizes] = useState([])
  const [newSize, setNewSize] = useState({
    size: '',
    description: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchSizes()
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const fetchSizes = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('shoe_sizes')
        .select('*')
        .order('size', { ascending: true })
      
      if (error) throw error
      setSizes(data || [])
    } catch (error) {
      toast.error("Error fetching shoe sizes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSize = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from('shoe_sizes')
        .insert([{
          size: parseFloat(newSize.size),
          description: newSize.description
        }])
      
      if (error) throw error
      
      toast.success("Size added successfully")
      setNewSize({ size: '', description: '' })
      fetchSizes()
    } catch (error) {
      toast.error("Error adding size")
    } finally {
      setIsLoading(false)
    }
  }

  const openDeleteDialog = (id) => {
    setDeletingId(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteSize = async () => {
    if (!deletingId) return
    
    try {
      const { error } = await supabase
        .from('shoe_sizes')
        .delete()
        .eq('id', deletingId)
      
      if (error) throw error
      
      toast.success("Size deleted successfully")
      fetchSizes()
    } catch (error) {
      toast.error("Error deleting size")
    } finally {
      setDeletingId(null)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the shoe size from our database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSize}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                <CardTitle>Add New Shoe Size</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSize} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="size">Size</Label>
                      <Input
                        id="size"
                        type="number"
                        step="0.5"
                        value={newSize.size}
                        onChange={(e) => setNewSize({...newSize, size: e.target.value})}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newSize.description}
                        onChange={(e) => setNewSize({...newSize, description: e.target.value})}
                        placeholder="Optional"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? 'Adding...' : 'Add Size'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Shoe Sizes</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading && !deletingId ? (
                  <div className="flex justify-center items-center h-32">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : sizes.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-gray-100">
                        <TableRow>
                          <TableHead className="w-[25%]">Size</TableHead>
                          <TableHead className="w-[60%]">Description</TableHead>
                          <TableHead className="w-[15%] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sizes.map((size) => (
                          <TableRow key={size.id}>
                            <TableCell className="font-medium">{size.size}</TableCell>
                            <TableCell>{size.description || '-'}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openDeleteDialog(size.id)}
                                disabled={deletingId === size.id}
                              >
                                {deletingId === size.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                <span className="ml-2">Delete</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500 text-lg">No shoe sizes found</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={fetchSizes}
                      disabled={isLoading}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
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