"use client"

import { ShoppingCart, Users, Footprints, Package, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Sidebar() {
  const pathname = usePathname()
  
  const navItems = [
    { 
      name: 'POS', 
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
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home,
    },
  ]

  return (
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
  )
}