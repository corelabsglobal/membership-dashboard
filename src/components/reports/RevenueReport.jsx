import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, startOfMonth } from 'date-fns'

export async function RevenueReport() {
  // Get the first day of the current month
  const firstDayOfMonth = startOfMonth(new Date())
  
  // Monthly revenue
  const { data: monthlyRevenue } = await supabase
    .from('payments')
    .select('sum(amount)')
    .gte('payment_date', format(firstDayOfMonth, 'yyyy-MM-dd'))

  // Total revenue
  const { data: totalRevenue } = await supabase
    .from('payments')
    .select('sum(amount)')

  // Active subscriptions count
  const { count: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            GHS {(monthlyRevenue?.[0]?.sum || 0).toLocaleString()}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            GHS {(totalRevenue?.[0]?.sum || 0).toLocaleString()}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {activeSubscriptions || 0}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}