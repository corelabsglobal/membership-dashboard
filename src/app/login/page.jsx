import { AuthForm } from '@/components/auth/AuthForm'
import { checkAdminAccess } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const { isAdmin } = await checkAdminAccess()
  
  if (isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AuthForm mode="login" />
    </div>
  )
}