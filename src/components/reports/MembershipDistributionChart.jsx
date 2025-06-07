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

        // Assign specific colors to known plans
        const colorMap = {
          'Monthly': '#4F46E5',  
          'Monthly Unlimited': '#10B981',
          'Unknown': '#F59E0B', 
        }

        const fallbackColors = [
          '#6366F1',
          '#14B8A6',
          '#EC4899', 
          '#F97316',
          '#A78BFA',
          '#F43F5E',
          '#22D3EE',
        ]

        const backgroundColor = labels.map((label, idx) =>
          colorMap[label] || fallbackColors[idx % fallbackColors.length]
        )

        setChartData({
          labels,
          datasets: [
            {
              data: counts,
              backgroundColor,
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
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const label = context.label || ''
                      const value = context.raw || 0
                      return `${label}: ${value} member${value > 1 ? 's' : ''}`
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