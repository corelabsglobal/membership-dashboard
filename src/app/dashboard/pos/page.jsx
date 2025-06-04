"use client"

import { PosDashboard } from '@/components/pos/dashboard'
import { Topbar } from '@/components/layout/Topbar'
import { PosInterface } from '@/components/pos/interface'
import { ShoppingCart, Users, Footprints, Package, Home } from 'lucide-react'
import Link from 'next/link'
import CustomersPage from './customers/page'
import InventoryPage from './inventory/page'
import ShoeSizesPage from './shoe-sizes/page'
import DashboardPage from '@/app/page'
import { usePathname } from 'next/navigation'

export default function PosPage() {
  const pathname = usePathname()
  
  const navItems = [
    { 
      name: 'POS', 
      href: '/dashboard/pos', 
      icon: ShoppingCart,
      component: (
        <div className="flex flex-col md:flex-row h-full">
          <div className="w-full md:w-2/3 p-4">
            <PosInterface />
          </div>
          <div className="w-full md:w-1/3 p-4 border-l">
            <PosDashboard />
          </div>
        </div>
      )
    },
    { 
      name: 'Customers', 
      href: '/dashboard/pos/customers', 
      icon: Users,
      component: <CustomersPage />
    },
    { 
      name: 'Shoe Sizes', 
      href: '/dashboard/pos/shoe-sizes', 
      icon: Footprints,
      component: <ShoeSizesPage />
    },
    { 
      name: 'Inventory', 
      href: '/dashboard/pos/inventory', 
      icon: Package,
      component: <InventoryPage />
    },
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home,
      component: <DashboardPage />
    },
  ]

  const currentPage = navItems.find(item => pathname.startsWith(item.href)) || navItems[0]

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <div className="hidden md:flex md:w-56 flex-col border-r bg-muted/40">
        <div className="flex h-[60px] items-center px-6">
          <h2 className="font-semibold text-lg">POS System</h2>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="flex flex-col items-start px-4 space-y-3">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted ${
                    isActive ? 'bg-muted font-medium' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-auto p-4">
          {currentPage.component}
        </div>
      </div>
    </div>
  )
}