import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, startOfMonth } from 'date-fns'
import { Calendar } from "@/components/ui/calendar"
import { useEffect, useState } from 'react'

export function RevenueReport() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [activeSubscriptions, setActiveSubscriptions] = useState(0)
  const [dailyRevenue, setDailyRevenue] = useState({})
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    const fetchData = async () => {
      // Get the first day of the current month
      const firstDayOfMonth = startOfMonth(new Date())
      
      // Monthly revenue
      const { data: monthlyData } = await supabase
        .from('payments')
        .select('amount, payment_date')
        .gte('payment_date', format(firstDayOfMonth, 'yyyy-MM-dd'))

      // Calculate monthly sum
      const monthlySum = monthlyData?.reduce((acc, payment) => acc + Number(payment.amount), 0) || 0
      setMonthlyRevenue(monthlySum)

      // Total revenue
      const { data: totalData } = await supabase
        .from('payments')
        .select('amount, payment_date')

      // Calculate total sum
      const totalSum = totalData?.reduce((acc, payment) => acc + Number(payment.amount), 0) || 0
      setTotalRevenue(totalSum)

      // Active subscriptions count
      const { count: activeCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      setActiveSubscriptions(activeCount || 0)

      // Prepare daily revenue data
      const dailyData = {}
      totalData?.forEach(payment => {
        const date = new Date(payment.payment_date).toISOString().split('T')[0]
        dailyData[date] = (dailyData[date] || 0) + Number(payment.amount)
      })
      setDailyRevenue(dailyData)
    }

    fetchData()
  }, [])

  const handleDateSelect = (date) => {
    setSelectedDate(date)
  }

  const getSelectedDateRevenue = () => {
    if (!selectedDate) return 0
    const dateKey = selectedDate.toISOString().split('T')[0]
    return dailyRevenue[dateKey] || 0
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GHS {monthlyRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GHS {totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSubscriptions}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-8">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="rounded-md border"
          />
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-sm text-muted-foreground">
              Revenue for {selectedDate?.toLocaleDateString()}
            </div>
            <div className="text-2xl font-bold mt-2">
              GHS {getSelectedDateRevenue().toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}