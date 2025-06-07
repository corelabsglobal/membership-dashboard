import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'

export function MemberActivityTable() {
  const [activeMembers, setActiveMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActiveMembers = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('members')
          .select(`
            id,
            first_name,
            last_name,
            email,
            subscriptions!inner(
              id,
              is_active,
              remaining_sessions,
              membership_plans(name)
            )
          `)
          .eq('subscriptions.is_active', true)
          .order('first_name', { ascending: true })

        if (error) throw error
        setActiveMembers(data || [])
      } catch (error) {
        console.error('Error fetching active members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveMembers()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Members</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading active members...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Remaining Sessions</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeMembers.length > 0 ? (
                activeMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      {member.first_name} {member.last_name}
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </TableCell>
                    <TableCell>
                      {member.subscriptions[0]?.membership_plans?.name || 'No plan'}
                    </TableCell>
                    <TableCell>
                      {member.subscriptions[0]?.remaining_sessions || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.subscriptions[0]?.is_active ? 'default' : 'secondary'}>
                        {member.subscriptions[0]?.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No active members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}