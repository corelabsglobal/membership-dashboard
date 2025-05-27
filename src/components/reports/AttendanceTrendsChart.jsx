'use client'

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, subDays } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export function AttendanceTrendsChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      label: 'Check-ins',
      data: [],
      backgroundColor: 'oklch(var(--primary))',
    }]
  })

  useEffect(() => {
    const fetchData = async () => {
      // Get last 7 days
      const dateLabels = []
      for (let i = 6; i >= 0; i--) {
        dateLabels.push(format(subDays(new Date(), i), 'EEE'))
      }

      // Get counts for each day
      const dayCounts = await Promise.all(
        Array(7).fill().map(async (_, i) => {
          const date = subDays(new Date(), 6 - i)
          const start = new Date(date.setHours(0, 0, 0, 0)).toISOString()
          const end = new Date(date.setHours(23, 59, 59, 999)).toISOString()
          
          const { count } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .gte('check_in_time', start)
            .lte('check_in_time', end)
          
          return count || 0
        })
      )

      setChartData({
        labels: dateLabels,
        datasets: [{
          label: 'Check-ins',
          data: dayCounts,
          backgroundColor: 'oklch(var(--primary))',
        }]
      })
    }
    
    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Attendance Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <Bar 
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    precision: 0
                  }
                }
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}