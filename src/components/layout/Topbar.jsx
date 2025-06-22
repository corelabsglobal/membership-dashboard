'use client'

import { Bell, Search, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export function Topbar({ toggleSidebar }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log(session)
      setIsAuthenticated(!!session)
    }
    checkAuth()
  }, [])

  return (
    <header className="sticky top-0 z-10 bg-card shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full cursor-pointer"
            onClick={toggleSidebar}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center flex-1 max-w-md">
          {/*<Search className="w-5 h-5 ml-3 text-muted-foreground absolute" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-10 bg-muted/50 border-none focus-visible:ring-1"
          />*/}
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="rounded-full cursor-pointer">
            <Bell className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full cursor-pointer"
            onClick={() => router.push(isAuthenticated ? '/dashboard' : '/login')}
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}