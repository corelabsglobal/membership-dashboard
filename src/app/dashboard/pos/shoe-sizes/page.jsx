"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/pos/Sidebar'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function ShoeSizesPage() {
  const [sizes, setSizes] = useState([])
  const [newSize, setNewSize] = useState({
    size: '',
    description: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchSizes()
  }, [])

  const fetchSizes = async () => {
    try {
      const { data, error } = await supabase
        .from('shoe_sizes')
        .select('*')
        .order('size', { ascending: true })
      
      if (error) throw error
      setSizes(data)
    } catch (error) {
      toast.error("Error fetching shoe sizes")
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
      
      setNewSize({
        size: '',
        description: ''
      })
      
      fetchSizes()
    } catch (error) {
      toast.error("Error adding size")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Shoe Size</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSize} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="size">Size</Label>
                      <Input
                        id="size"
                        type="number"
                        step="0.5"
                        value={newSize.size}
                        onChange={(e) => setNewSize({...newSize, size: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newSize.description}
                        onChange={(e) => setNewSize({...newSize, description: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading}>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sizes.map((size) => (
                      <TableRow key={size.id}>
                        <TableCell>{size.size}</TableCell>
                        <TableCell>{size.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}