'use client'

import { supabase } from '@/lib/supabase'
import { Users, Calendar, CreditCard, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'

export function OverviewCards() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)

        const today = now.toISOString().split('T')[0]
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        const [
          { count: membersCount },
          { count: lastMonthMembersCount },
          { count: activeSubscriptions },
          { count: lastMonthActiveSubscriptions },
          { count: sessionsToday },
          { count: sessionsYesterday },
          { data: paymentsData },
          { data: lastMonthPaymentsData },
          { data: posSessionsData },
          { data: lastMonthPosSessionsData }
        ] = await Promise.all([
          supabase.from('members').select('*', { count: 'exact', head: true }),
          supabase.from('members')
            .select('*', { count: 'exact', head: true })
            .lt('created_at', firstDayOfMonth.toISOString()),
          supabase.from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),
          supabase.from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .lt('created_at', firstDayOfMonth.toISOString()),
          supabase.from('sessions')
            .select('*', { count: 'exact', head: true })
            .gte('check_in_time', today),
          supabase.from('sessions')
            .select('*', { count: 'exact', head: true })
            .gte('check_in_time', yesterdayStr)
            .lt('check_in_time', today),
          supabase.from('payments')
            .select('sum(amount)')
            .gte('payment_date', firstDayOfMonth.toISOString())
            .lte('payment_date', lastDayOfMonth.toISOString()),
          supabase.from('payments')
            .select('sum(amount)')
            .gte('payment_date', firstDayOfLastMonth.toISOString())
            .lte('payment_date', lastDayOfLastMonth.toISOString()),
          supabase.from('pos_sessions')
            .select('sum(amount_paid)')
            .gte('created_at', firstDayOfMonth.toISOString())
            .lte('created_at', lastDayOfMonth.toISOString()),
          supabase.from('pos_sessions')
            .select('sum(amount_paid)')
            .gte('created_at', firstDayOfLastMonth.toISOString())
            .lte('created_at', lastDayOfLastMonth.toISOString())
        ])

        const currentPayments = paymentsData?.[0]?.sum || 0
        const currentPosSessions = posSessionsData?.[0]?.sum || 0
        const currentRevenue = currentPayments + currentPosSessions

        const lastMonthPayments = lastMonthPaymentsData?.[0]?.sum || 0
        const lastMonthPosSessions = lastMonthPosSessionsData?.[0]?.sum || 0
        const lastMonthRevenue = lastMonthPayments + lastMonthPosSessions

        // Calculate differences and percentages
        const memberDiff = membersCount - (lastMonthMembersCount || 0)
        const memberPercentage = lastMonthMembersCount 
          ? Math.round((memberDiff / lastMonthMembersCount) * 100) 
          : 100

        const subscriptionDiff = activeSubscriptions - (lastMonthActiveSubscriptions || 0)
        const subscriptionPercentage = lastMonthActiveSubscriptions 
          ? Math.round((subscriptionDiff / lastMonthActiveSubscriptions) * 100) 
          : 100

        const sessionDiff = sessionsToday - (sessionsYesterday || 0)
        const sessionText = sessionsYesterday 
          ? `${sessionDiff >= 0 ? '+' : ''}${sessionDiff} from yesterday` 
          : 'No data for yesterday'

        const revenueDiff = currentRevenue - lastMonthRevenue
        const revenuePercentage = lastMonthRevenue 
          ? Math.round((revenueDiff / lastMonthRevenue) * 100) 
          : 100

        setCards([
          {
            title: "Total Members",
            value: membersCount || 0,
            icon: Users,
            description: `${memberDiff >= 0 ? '+' : ''}${memberDiff} (${memberPercentage}%) from last month`
          },
          {
            title: "Active Memberships",
            value: activeSubscriptions || 0,
            icon: CreditCard,
            description: `${subscriptionDiff >= 0 ? '+' : ''}${subscriptionDiff} (${subscriptionPercentage}%) from last month`
          },
          {
            title: "Today's Check-ins",
            value: sessionsToday || 0,
            icon: Calendar,
            description: sessionText
          },
          //{
            //title: "Monthly Revenue",
            //value: `GHS ${currentRevenue.toLocaleString()}`,
            //icon: Activity,
            //description: `${revenueDiff >= 0 ? '+' : ''}GHS ${Math.abs(revenueDiff).toLocaleString()} (${revenuePercentage}%) from last month`
          //}
        ])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Fallback to basic cards if there's an error
        setCards([
          {
            title: "Total Members",
            value: 0,
            icon: Users,
            description: "Data unavailable"
          },
          {
            title: "Active Memberships",
            value: 0,
            icon: CreditCard,
            description: "Data unavailable"
          },
          {
            title: "Today's Check-ins",
            value: 0,
            icon: Calendar,
            description: "Data unavailable"
          },
          //{
            //title: "Monthly Revenue",
            //value: "GHS 0",
            //icon: Activity,
            //description: "Data unavailable"
          //}
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}