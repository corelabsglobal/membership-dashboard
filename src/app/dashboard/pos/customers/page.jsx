"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Download } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import jsPDF from 'jspdf'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      let query = supabase
        .from('walkin_customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
        )
      }

      const { data, error } = await query

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      toast.error("Error fetching customers")
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'First Visit', 'Total Visits']
    const data = customers.map(customer => [
      `${customer.first_name} ${customer.last_name}`,
      customer.email || '-',
      customer.phone || '-',
      new Date(customer.created_at).toLocaleDateString(),
      customer.visits_count || 0
    ])

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('CSV exported successfully')
  }

  const exportToPDF = () => {
    try {
      const doc = new jsPDF()
      
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.setFont('helvetica', 'bold')
      doc.text('Customer Directory', 105, 20, { align: 'center' })
      
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' })
      
      doc.setDrawColor(200, 200, 200)
      doc.line(20, 35, 190, 35)
      
      // Initial y position for customer cards
      let yPosition = 45
      
      // Add each customer as a card
      customers.forEach((customer, index) => {
        if (yPosition > 250 && index < customers.length - 1) {
          doc.addPage()
          yPosition = 20
        }
        
        // Add customer card background
        doc.setFillColor(245, 245, 245)
        doc.roundedRect(20, yPosition, 170, 30, 3, 3, 'F')
        
        // Customer name
        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.setFont('helvetica', 'bold')
        doc.text(`${customer.first_name} ${customer.last_name}`, 25, yPosition + 10)
        
        // Contact info
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.setFont('helvetica', 'normal')
        doc.text(`Email: ${customer.email || 'N/A'}`, 25, yPosition + 18)
        doc.text(`Phone: ${customer.phone || 'N/A'}`, 25, yPosition + 25)
        
        doc.text(`First Visit: ${new Date(customer.created_at).toLocaleDateString()}`, 130, yPosition + 18)
        doc.text(`Total Visits: ${customer.visits_count || 0}`, 130, yPosition + 25)
        
        doc.setFillColor(75, 192, 192)
        doc.roundedRect(180, yPosition + 5, 3, 20, 1, 1, 'F')
        
        yPosition += 35
      })
      
      // Save the PDF
      doc.save(`customers_directory_${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast.success('PDF exported successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
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
      
      <div className="flex flex-col flex-1 md:pl-64">
        <div className="sticky top-0 z-10">
          <Topbar toggleSidebar={toggleSidebar} />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Walk-In Customers</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={exportToCSV}>
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToPDF}>
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:max-w-md"
                    onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
                  />
                  <Button 
                    onClick={fetchCustomers}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Searching...' : 'Search'}
                  </Button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : customers.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-gray-100">
                        <TableRow>
                          <TableHead className="w-[25%]">Name</TableHead>
                          <TableHead className="w-[25%]">Email</TableHead>
                          <TableHead className="w-[20%]">Phone</TableHead>
                          <TableHead className="w-[15%]">First Visit</TableHead>
                          <TableHead className="w-[15%] text-right">Visits</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">
                              {customer.first_name} {customer.last_name}
                            </TableCell>
                            <TableCell>{customer.email || '-'}</TableCell>
                            <TableCell>{customer.phone || '-'}</TableCell>
                            <TableCell>
                              {new Date(customer.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {customer.visits_count || 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500 text-lg">No customers found</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={fetchCustomers}
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