'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'

export function AuthForm({ mode = 'login' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single()

        if (!profile?.is_admin) {
          toast.error('Access restricted. Only administrator accounts can access this dashboard.')
          await supabase.auth.signOut()
          return
        }

        toast.success('Login successful. Redirecting to dashboard...')
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              is_admin: false,
            },
          },
        })
        if (error) throw error

        toast.success('Check your email. We sent you a confirmation link to verify your account.')
      }
    } catch (error) {
      toast.error(error.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800 sm:p-6 md:p-8">
      <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl shadow-lg">
        <CardHeader className="space-y-2 sm:space-y-3 md:space-y-4">
          <div className="flex justify-center">
            <Icons.logo className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16" />
          </div>
          <CardTitle className="text-center text-2xl font-bold sm:text-3xl md:text-4xl">
            {mode === 'login' ? 'Admin Portal' : 'Create Account'}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:gap-6 md:gap-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="sm:text-lg">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus:ring-primary/50 sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="sm:text-lg">Password</Label>
                {mode === 'login' && (
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline sm:text-base"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus:ring-primary/50 sm:text-base"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:text-base"
              size="lg"
            >
              {loading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin sm:h-5 sm:w-5" />
              )}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {mode === 'login' ? (
            <div className="mt-4 text-center text-sm sm:mt-6 sm:text-base">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-primary hover:underline sm:text-base"
              >
                Sign up
              </Link>
            </div>
          ) : (
            <div className="mt-4 text-center text-sm sm:mt-6 sm:text-base">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline sm:text-base"
              >
                Sign in
              </Link>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase sm:text-sm">
              <span className="bg-background px-2 text-muted-foreground">
                Secure Access
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}