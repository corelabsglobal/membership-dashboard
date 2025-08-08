"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import { Pencil, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditSessionDialog } from './EditSessionDialog'
import { differenceInHours } from 'date-fns'

export function PosDashboard() {
  const [todaySessions, setTodaySessions] = useState([])
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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
            skate_inventory(name),
            payments(transaction_id, amount, modified_amount, modified_at)
          `)
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: false })

        if (sessions && sessions.length > 0) {
          const { data: edits } = await supabase
            .from('session_edits')
            .select('*')
            .in('session_id', sessions.map(s => s.id))

          const sessionsWithEdits = sessions.map(session => ({
            ...session,
            session_edits: edits?.filter(edit => edit.session_id === session.id) || []
          }))

          setTodaySessions(sessionsWithEdits)
          
          // Calculate total using modified amounts where available
          const total = sessionsWithEdits.reduce((sum, session) => {
            const amount = session.payments?.modified_amount ?? session.payments?.amount ?? session.amount_paid
            return sum + amount
          }, 0)
          setTodayRevenue(total)
        } else {
          setTodaySessions([])
          setTodayRevenue(0)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const canEditSession = (session) => {
    const now = new Date()
    const sessionDate = new Date(session.created_at)
    return differenceInHours(now, sessionDate) < 1
  }

  const handleEditSession = (session) => {
    if (!canEditSession(session)) {
      alert('This session can no longer be edited (1-hour limit has passed)')
      return
    }
    setSelectedSession(session)
    setIsDialogOpen(true)
  }

  const handleSessionUpdated = (updatedSession) => {
    setTodaySessions(prev => prev.map(s => 
      s.id === updatedSession.id ? updatedSession : s
    ))
    
    // Recalculate total revenue with proper amounts
    const total = todaySessions.reduce((sum, session) => {
      const amount = session.payments?.modified_amount ?? session.payments?.amount ?? session.amount_paid
      return sum + amount
    }, 0)
    setTodayRevenue(total)
    
    setIsDialogOpen(false)
  }

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
                <TableHead>Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todaySessions.map((session) => {
                const originalAmount = session.payments?.amount ?? session.amount_paid
                const currentAmount = session.payments?.modified_amount ?? originalAmount
                const hasBeenModified = session.payments?.modified_amount !== undefined && 
                                      session.payments?.modified_amount !== null &&
                                      session.payments?.modified_amount !== originalAmount

                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      {session.walkin_customers?.first_name} {session.walkin_customers?.last_name}
                      {hasBeenModified && (
                        <span className="ml-2 text-yellow-600 flex items-center gap-1">
                          <AlertTriangle size={14} />
                          <span className="text-xs">Modified</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(session.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </TableCell>
                    <TableCell>{session.duration_minutes} min</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col">
                        <span>₵{currentAmount.toFixed(2)}</span>
                        {hasBeenModified && (
                          <span className="text-xs line-through text-gray-500">
                            ₵{originalAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSession(session)}
                        disabled={!canEditSession(session)}
                        title={!canEditSession(session) ? "Cannot edit after 1 hour" : ""}
                      >
                        <Pencil size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedSession && (
        <EditSessionDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          session={selectedSession}
          onSuccess={handleSessionUpdated}
        />
      )}
    </div>
  )
}