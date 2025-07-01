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

export function MemberTable() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState(null)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
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
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('member_id', memberToDelete.id)
      
      if (subscriptionError) throw subscriptionError

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
    try {
      const doc = new jsPDF()
      
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.setFont('helvetica', 'bold')
      doc.text('Skating Membership Report', 105, 20, { align: 'center' })
      
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' })
      
      doc.setDrawColor(200, 200, 200)
      doc.line(20, 35, 190, 35)
      
      // Initial y position for member cards
      let yPosition = 45
      
      // Add each member as a card
      members.forEach((member, index) => {
        if (yPosition > 250 && index < members.length - 1) {
          doc.addPage()
          yPosition = 20
        }
        
        doc.setFillColor(245, 245, 245)
        doc.roundedRect(20, yPosition, 170, 30, 3, 3, 'F')
        
        // Member name
        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.setFont('helvetica', 'bold')
        doc.text(`${member.first_name} ${member.last_name}`, 25, yPosition + 10)
        
        // Contact info
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.setFont('helvetica', 'normal')
        doc.text(`Email: ${member.email || 'N/A'}`, 25, yPosition + 18)
        doc.text(`Phone: ${member.phone || 'N/A'}`, 25, yPosition + 25)
        
        doc.text(`Joined: ${new Date(member.created_at).toLocaleDateString()}`, 130, yPosition + 18)
        
        doc.setFillColor(41, 128, 185)
        doc.roundedRect(180, yPosition + 5, 3, 20, 1, 1, 'F')
        
        yPosition += 35
      })
      
      // Save the PDF
      doc.save(`members_report_${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast.success('PDF exported successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    }
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