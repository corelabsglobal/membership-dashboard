import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export async function RecentActivity() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const { data: recentSessions, error } = await supabase
    .from('sessions')
    .select(
      id,
      check_in_time,
      subscriptions(
        members(first_name, last_name),
        membership_plans(name)
      )
    )
    .order('check_in_time', { ascending: false })
    .gte('check_in_time', todayISO)

  if (error) {
    console.error('Error fetching recent sessions:', error)
    return <div>Error loading recent activity</div>
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-4">Today's Check-Ins</h2>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Check-In Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSessions?.map((session) => (
              <TableRow key={session.id}>
                <TableCell>
                  {session.subscriptions?.members?.first_name}{' '}
                  {session.subscriptions?.members?.last_name}
                </TableCell>
                <TableCell>
                  {session.subscriptions?.membership_plans?.name}
                </TableCell>
                <TableCell>
                  {new Date(session.check_in_time).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}