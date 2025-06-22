"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, CreditCard, Settings, Activity, ShoppingCart, ChevronDown, ChevronUp, Footprints, Package } from 'lucide-react'
import { useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const [isPosOpen, setIsPosOpen] = useState(false)
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Members', href: '/dashboard/members', icon: Users },
    { name: 'Check-In', href: '/dashboard/check-in', icon: Calendar },
    { name: 'Plans', href: '/dashboard/plans', icon: CreditCard },
    { name: 'Reports', href: '/dashboard/reports', icon: Activity },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const posItems = [
    { 
      name: 'Walk Ins', 
      href: '/dashboard/pos', 
      icon: ShoppingCart,
    },
    { 
      name: 'Customers', 
      href: '/dashboard/pos/customers', 
      icon: Users,
    },
    { 
      name: 'Shoe Sizes', 
      href: '/dashboard/pos/shoe-sizes', 
      icon: Footprints,
    },
    { 
      name: 'Inventory', 
      href: '/dashboard/pos/inventory', 
      icon: Package,
    },
  ]

  const isPosActive = posItems.some(item => pathname === item.href)

  return (
    <div className="w-full h-full">
      <div className="flex flex-col h-full px-3 py-4 border-r bg-sidebar">
        <div className="flex items-center justify-center h-16 mb-6">
          <h1 className="text-xl font-bold text-primary">Skate City</h1>
        </div>
        <div className="flex-grow">
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}

            <div className="space-y-1">
              <button
                onClick={() => setIsPosOpen(!isPosOpen)}
                className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isPosActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <div className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-3" />
                  POS
                </div>
                {isPosOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {isPosOpen && (
                <div className="ml-4 space-y-1">
                  {posItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </div>
  )
}