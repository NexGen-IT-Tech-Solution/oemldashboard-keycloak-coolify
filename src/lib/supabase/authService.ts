import { supabase } from './client'

export { supabase }

export interface SupabaseUser {
  id: string
  email: string
  fullName: string
  role: string
  status: string
  type: string
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  type: string
  created_at: string
}

export const getCurrentSupabaseUser = async (): Promise<SupabaseUser | null> => {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .eq('app_id', 'oemldashboard')
    .single()

  if (profileError || !profile) {
    return {
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      role: user.user_metadata?.role || 'internal',
      status: user.email_confirmed_at ? 'active' : 'deactivated',
      type: 'internal',
      created_at: user.created_at,
    }
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    status: profile.status,
    type: profile.type,
    created_at: profile.created_at,
  }
}

export const fetchSupabaseUsers = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('app_id', 'oemldashboard')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return data || []
}

export const updateSupabaseUser = async (
  userId: string,
  updates: Partial<Pick<UserProfile, 'full_name' | 'role' | 'status' | 'type'>>
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .eq('app_id', 'oemldashboard')

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export const createSupabaseUser = async (
  email: string,
  password: string,
  fullName: string,
  role: string
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  const { data, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName, role },
  })

  if (signUpError) {
    return { success: false, error: signUpError.message }
  }

  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      app_id: 'oemldashboard',
      email,
      full_name: fullName,
      role,
      status: 'active',
      type: 'internal',
    })

    return { success: true, userId: data.user.id }
  }

  return { success: false, error: 'Failed to create user' }
}
