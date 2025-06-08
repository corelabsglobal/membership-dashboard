"use client"

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
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:block fixed h-full">
        <Sidebar />
      </div>
      
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <div className="sticky top-0 z-10">
          <Topbar />
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