'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

ChartJS.register(ArcElement, Tooltip, Legend)

export function MembershipDistributionChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
    }]
  })

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('membership_plans(name), count')
        .not('plan_id', 'is', null)
        .groupBy('plan_id, membership_plans(name)')
      
      if (error) {
        console.error('Error fetching subscription data:', error)
        return
      }
      
      const labels = data.map(item => item.membership_plans?.name || 'Unknown')
      const counts = data.map(item => item.count)
      
      const backgroundColors = [
        'oklch(var(--chart-1))',
        'oklch(var(--chart-2))',
        'oklch(var(--chart-3))',
        'oklch(var(--chart-4))',
        'oklch(var(--chart-5))'
      ]
      
      setChartData({
        labels,
        datasets: [{
          data: counts,
          backgroundColor: backgroundColors.slice(0, counts.length),
          borderWidth: 1,
        }]
      })
    }
    
    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership Plan Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <Doughnut 
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}