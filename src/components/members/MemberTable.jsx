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

export function MemberTable() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setMembers(data)
      } catch (error) {
        console.error('Error fetching members: ', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchMembers()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>{member.first_name} {member.last_name}</TableCell>
            <TableCell>{member.email}</TableCell>
            <TableCell>{member.phone}</TableCell>
            <TableCell>
              {new Date(member.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              {/* Add action buttons */}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}