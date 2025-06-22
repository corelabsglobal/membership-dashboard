"use client"

import { useState } from 'react'
import { PosDashboard } from '@/components/pos/dashboard'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { PosInterface } from '@/components/pos/interface'
import { usePathname } from 'next/navigation'
import CustomersPage from './customers/page'
import InventoryPage from './inventory/page'
import ShoeSizesPage from './shoe-sizes/page'
import DashboardPage from '@/app/page'

export default function PosPage() {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const pageComponents = {
    '/dashboard/pos': (
      <div className="flex flex-col md:flex-row h-full">
        <div className="w-full md:w-2/3 p-4">
          <PosInterface />
        </div>
        <div className="w-full md:w-1/3 p-4 border-l">
          <PosDashboard />
        </div>
      </div>
    ),
    '/dashboard/pos/customers': <CustomersPage />,
    '/dashboard/pos/shoe-sizes': <ShoeSizesPage />,
    '/dashboard/pos/inventory': <InventoryPage />,
    '/dashboard': <DashboardPage />
  }

  const currentComponent = Object.entries(pageComponents)
    .find(([path]) => pathname.startsWith(path))?.[1] || pageComponents['/dashboard/pos']

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 z-30 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar />
      </div>
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 md:pl-64">
        <div className="sticky top-0 z-10">
          <Topbar toggleSidebar={toggleSidebar} />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {currentComponent}
          </div>
        </main>
      </div>
    </div>
  )
}