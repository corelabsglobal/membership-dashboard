'use client'

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
import { Edit, Trash2 } from 'lucide-react'
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

  if (loading) return <div className="py-4">Loading members...</div>

  return (
    <>
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