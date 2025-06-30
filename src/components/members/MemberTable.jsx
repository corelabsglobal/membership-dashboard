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
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function MemberTable() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState(null)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Fetch members with their active subscriptions and plan details
        const { data, error } = await supabase
          .from('members')
          .select(`
            *,
            subscriptions!inner(
              *,
              membership_plans!inner(*)
            )
          `)
          .eq('subscriptions.is_active', true)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setMembers(data)
      } catch (error) {
        console.error('Error fetching members: ', error)
        toast.error('Failed to load member data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchMembers()
  }, [])

  const handleDeleteClick = (member) => {
    setMemberToDelete(member)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return
    
    try {
      // First delete any active subscriptions
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('member_id', memberToDelete.id)
      
      if (subscriptionError) throw subscriptionError

      // Then delete the member
      const { error: memberError } = await supabase
        .from('members')
        .delete()
        .eq('id', memberToDelete.id)
      
      if (memberError) throw memberError
      
      setMembers(members.filter(member => member.id !== memberToDelete.id))
      toast.success('Member deleted successfully')
    } catch (error) {
      console.error('Error deleting member: ', error)
      toast.error('Failed to delete member')
    } finally {
      setDeleteDialogOpen(false)
      setMemberToDelete(null)
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Plan', 'Status', 'Date Joined']
    const data = members.map(member => {
      const activeSubscription = member.subscriptions?.[0]
      const plan = activeSubscription?.membership_plans
      const status = activeSubscription 
        ? (plan.is_unlimited_sessions ? 'Unlimited' : `${activeSubscription.remaining_sessions} remaining`)
        : 'Inactive'

      return [
        `${member.first_name} ${member.last_name}`,
        member.email,
        member.phone,
        plan?.name || 'No plan',
        status,
        new Date(member.created_at).toLocaleDateString()
      ]
    })

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `members_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    // Create a new jsPDF instance
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.text('Member List', 14, 15)
    
    // Add current date
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22)
    
    // Prepare data for the table
    const tableData = members.map(member => [
      `${member.first_name} ${member.last_name}`,
      member.email || '-',
      member.phone || '-',
      new Date(member.created_at).toLocaleDateString()
    ])
    
    // Add table using autoTable plugin
    doc.autoTable({
      head: [['Name', 'Email', 'Phone', 'Date Joined']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 30 }
    })
    
    doc.save(`members_${new Date().toISOString().split('T')[0]}.pdf`)
    
    toast.success('PDF exported successfully')
  }

  if (loading) return <div className="py-4">Loading members...</div>

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Members</h2>
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
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const activeSubscription = member.subscriptions?.[0]
            const plan = activeSubscription?.membership_plans
            
            return (
              <TableRow key={member.id}>
                <TableCell>{member.first_name} {member.last_name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.phone}</TableCell>
                <TableCell>
                  {plan ? (
                    <div className="flex items-center gap-1">
                      <span>{plan.name}</span>
                      {plan.is_unlimited_sessions && (
                        <Badge variant="outline" className="ml-1">Unlimited</Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No plan</span>
                  )}
                </TableCell>
                <TableCell>
                  {activeSubscription ? (
                    <div className="flex flex-col">
                      <span>
                        {plan.is_unlimited_sessions 
                          ? 'Unlimited sessions' 
                          : `${activeSubscription.remaining_sessions} remaining`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activeSubscription.start_date).toLocaleDateString()} -{' '}
                        {activeSubscription.end_date 
                          ? new Date(activeSubscription.end_date).toLocaleDateString()
                          : 'No end date'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Inactive</span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(member.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Link href={`/dashboard/members/edit/${member.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(member)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete {memberToDelete?.first_name} {memberToDelete?.last_name}'s membership record and any associated subscriptions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}