"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MembershipDistributionChart } from './MembershipDistributionChart'
import { AttendanceTrendsChart } from './AttendanceTrendsChart'
import { RevenueReport } from './RevenueReport'
import { MemberActivityTable } from './MemberActivityTable'

export function ReportsOverview() {
  return (
    <Tabs defaultValue="distribution" className="space-y-6">
      <TabsList>
        <TabsTrigger value="distribution">Membership Distribution</TabsTrigger>
        <TabsTrigger value="attendance">Attendance Trends</TabsTrigger>
        <TabsTrigger value="revenue">Revenue</TabsTrigger>
        <TabsTrigger value="activity">Member Activity</TabsTrigger>
      </TabsList>
      
      <TabsContent value="distribution" className="space-y-4">
        <MembershipDistributionChart />
      </TabsContent>
      
      <TabsContent value="attendance" className="space-y-4">
        <AttendanceTrendsChart />
      </TabsContent>
      
      <TabsContent value="revenue" className="space-y-4">
        <RevenueReport />
      </TabsContent>
      
      <TabsContent value="activity" className="space-y-4">
        <MemberActivityTable />
      </TabsContent>
    </Tabs>
  )
}