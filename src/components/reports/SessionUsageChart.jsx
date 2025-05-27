"use client"

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

ChartJS.register(ArcElement, Tooltip, Legend)

export function SessionUsageChart() {
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
        '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
      ]
      
      setChartData({
        labels,
        datasets: [{
          data: counts,
          backgroundColor: backgroundColors.slice(0, counts.length),
        }]
      })
    }
    
    fetchData()
  }, [])

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-medium mb-4">Membership Plan Distribution</h3>
      <div className="h-64">
        <Doughnut data={chartData} />
      </div>
    </div>
  )
}