import { supabase } from '@/lib/supabase'
import { Users, Calendar, CreditCard, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export async function OverviewCards() {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [
    { count: membersCount },
    { count: activeSubscriptions },
    { count: sessionsToday },
    { data: revenueData }
  ] = await Promise.all([
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).gte('check_in_time', new Date().toISOString().split('T')[0]),
    supabase
      .from('payments')
      .select('sum(amount)')
      .gte('payment_date', firstDayOfMonth.toISOString())
      .lte('payment_date', lastDayOfMonth.toISOString())
  ])

  const cards = [
    {
      title: "Total Members",
      value: membersCount || 0,
      icon: Users,
      description: "+5 from last month"
    },
    {
      title: "Active Memberships",
      value: activeSubscriptions || 0,
      icon: CreditCard,
      description: "+3 from last month"
    },
    {
      title: "Today's Check-ins",
      value: sessionsToday || 0,
      icon: Calendar,
      description: "+2 from yesterday"
    },
    {
      title: "Monthly Revenue",
      value: `GHS ${(revenueData?.[0]?.sum || 0).toLocaleString()}`,
      icon: Activity,
      description: "+10% from last month"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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