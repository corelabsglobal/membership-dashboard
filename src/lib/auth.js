import { supabase } from './supabase'

export async function checkAdminAccess() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { isAdmin: false }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return { isAdmin: profile?.is_admin || false }
}