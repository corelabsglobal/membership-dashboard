'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

ChartJS.register(ArcElement, Tooltip, Legend)

export function MembershipDistributionChart() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderWidth: 1,
      },
    ],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select(`
            plan_id,
            membership_plans!subscriptions_plan_id_fkey(name)
          `)
          .not('plan_id', 'is', null)

        if (error) {
          throw new Error(`Error fetching subscription data: ${error.message}`)
        }

        // Group by plan name and count
        const countsMap = {}
        data.forEach(item => {
          const name = item.membership_plans?.name || 'Unknown'
          countsMap[name] = (countsMap[name] || 0) + 1
        })

        const labels = Object.keys(countsMap)
        const counts = Object.values(countsMap)

        const backgroundColors = [
          'oklch(var(--chart-1))',
          'oklch(var(--chart-2))',
          'oklch(var(--chart-3))',
          'oklch(var(--chart-4))',
          'oklch(var(--chart-5))',
          'oklch(var(--chart-6))',
          'oklch(var(--chart-7))',
        ]

        setChartData({
          labels,
          datasets: [
            {
              data: counts,
              backgroundColor: backgroundColors.slice(0, labels.length),
              borderWidth: 1,
            },
          ],
        })
      } catch (error) {
        console.error('Error fetching subscription data:', error)
        toast.error('Failed to load membership distribution data')
      }
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
                  labels: {
                    color: '#4B5563',
                    font: {
                      size: 14,
                    },
                  },
                },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}