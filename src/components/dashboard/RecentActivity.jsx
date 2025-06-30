"use client"

import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export function RecentActivity() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const { data, error } = await supabase
          .from('sessions')
          .select(`
            id,
            check_in_time,
            subscriptions(
              members(first_name, last_name),
              membership_plans(name)
            )
          `)
          .gte('check_in_time', today.toISOString())
          .order('check_in_time', { ascending: false })

        if (error) throw error
        setSessions(data || [])
      } catch (err) {
        console.error('Error fetching sessions:', err)
        setError('Failed to load check-ins')
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  // Calculate pagination
  const totalPages = Math.ceil(sessions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSessions = sessions.slice(startIndex, endIndex)

  if (loading) {
    return <div className="mt-6">Loading check-ins...</div>
  }

  if (error) {
    return <div className="mt-6 text-red-500">{error}</div>
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Today's Check-Ins</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Member</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentSessions.length > 0 ? (
              currentSessions.map((session) => {
                const checkInDate = new Date(session.check_in_time)
                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.subscriptions?.members?.first_name}{' '}
                      {session.subscriptions?.members?.last_name}
                    </TableCell>
                    <TableCell>
                      {session.subscriptions?.membership_plans?.name}
                    </TableCell>
                    <TableCell>
                      {checkInDate.toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {checkInDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                  No check-ins today
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {sessions.length > itemsPerPage && (
        <div className="flex justify-end mt-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}