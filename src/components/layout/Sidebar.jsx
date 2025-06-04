"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, CreditCard, Settings, Activity, ShoppingCart } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Members', href: '/dashboard/members', icon: Users },
    { name: 'Check-In', href: '/dashboard/check-in', icon: Calendar },
    { name: 'Plans', href: '/dashboard/plans', icon: CreditCard },
    { name: 'POS', href: '/dashboard/pos', icon: ShoppingCart },
    { name: 'Reports', href: '/dashboard/reports', icon: Activity },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="hidden md:flex md:w-64 md:flex-col fixed h-full">
      <div className="flex flex-col h-full px-3 py-4 border-r bg-sidebar">
        <div className="flex items-center justify-center h-16 mb-6">
          <h1 className="text-xl font-bold text-primary">FitClub</h1>
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
          </nav>
        </div>
      </div>
    </div>
  )
}