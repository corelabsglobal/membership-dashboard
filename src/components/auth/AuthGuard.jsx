'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PUBLIC_ROUTES = ['/login', '/signup']

export function AuthGuard({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authStatus, setAuthStatus] = useState('checking')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Skip auth check for public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
      setIsLoading(false)
      setAuthStatus('authenticated') // Bypass guard
      return
    }

    const checkAuth = async () => {
      try {
        setIsLoading(true)
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        if (!session) {
          setAuthStatus('unauthenticated')
        } else {
          setAuthStatus('authenticated')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setAuthStatus('unauthenticated')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Don't react to auth changes on public routes
      if (PUBLIC_ROUTES.includes(pathname)) return

      if (event === 'SIGNED_OUT') {
        setAuthStatus('unauthenticated')
      } else if (session) {
        setAuthStatus('authenticated')
      }
    })

    return () => subscription?.unsubscribe()
  }, [router, pathname])

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Skip guard for public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return children
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-50">
        <div className="max-w-md w-full p-6 mx-4 bg-card rounded-lg border shadow-lg">
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-bold">Authentication Required</h2>
            <p className="text-muted-foreground">
              You need to be logged in to access this page.
            </p>
            <div className="pt-4">
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
              >
                Go to Login Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return children
}