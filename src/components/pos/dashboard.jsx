"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'

export function PosDashboard() {
  const [todaySessions, setTodaySessions] = useState([])
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const { data: sessions } = await supabase
          .from('pos_sessions')
          .select(`
            *,
            walkin_customers(first_name, last_name),
            skate_inventory(name)
          `)
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: false })

        setTodaySessions(sessions || [])
        
        const total = sessions?.reduce((sum, session) => sum + session.amount_paid, 0) || 0
        setTodayRevenue(total)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Today's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₵{todayRevenue.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground">Total revenue today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>{isLoading ? 'Loading...' : `Showing ${todaySessions.length} sessions today`}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todaySessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    {session.walkin_customers?.first_name} {session.walkin_customers?.last_name}
                  </TableCell>
                  <TableCell>{session.duration_minutes} min</TableCell>
                  <TableCell className="text-right">₵{session.amount_paid.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}