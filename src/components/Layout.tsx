import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, LogOut, Bell } from 'lucide-react'
import keycloak from '@/lib/keycloak/client'
import { getUser } from '@/lib/keycloak/authService'
import { getCurrentSupabaseUser, getAuthProvider, clearAuthProvider, supabase } from '@/lib/supabase/authService'

interface AppUser {
  id: string
  email: string
  fullName: string
  role: string
  provider: 'supabase' | 'keycloak'
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [user, setUser] = useState<AppUser | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const provider = getAuthProvider()

      if (provider === 'supabase') {
        const supabaseUser = await getCurrentSupabaseUser()
        if (supabaseUser) {
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email,
            fullName: supabaseUser.fullName,
            role: supabaseUser.role,
            provider: 'supabase',
          })
        }
      } else if (provider === 'keycloak') {
        const keycloakUser = await getUser()
        if (keycloakUser) {
          setUser({
            id: keycloakUser.id,
            email: keycloakUser.email,
            fullName: keycloakUser.fullName,
            role: keycloakUser.role,
            provider: 'keycloak',
          })
        }
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    const provider = getAuthProvider()

    if (provider === 'supabase') {
      await supabase.auth.signOut()
    } else if (provider === 'keycloak') {
      keycloak.logout({
        redirectUri: window.location.origin + '/login'
      })
      return
    }

    clearAuthProvider()
    window.location.href = '/login'
  }

  const userName = user?.fullName || user?.email?.split('@')[0] || 'User'
  const roleName = user?.role ? user.role.replace(/([A-Z])/g, ' $1').trim() : 'User'

  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      <header className="h-16 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">Offshore Group</span>
            <span className="text-lg font-bold text-white">Dash</span>
          </div>
          
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                location.pathname === '/dashboard' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-neutral-900 text-neutral-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 bg-neutral-900/50 px-3 py-1.5 rounded-lg border border-neutral-800/50">
            <p className="text-xs text-neutral-400">Environment</p>
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Production
            </p>
          </div>

          <button className="relative p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-neutral-950" />
          </button>

          <div className="h-8 w-px bg-neutral-800 mx-1" />

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-neutral-200">{userName}</p>
              <p className="text-xs text-neutral-500 capitalize">{roleName}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-emerald-950 font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>

          <button onClick={handleLogout} className="ml-2 p-2 text-neutral-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        {children}
      </main>

      <footer className="border-t border-neutral-800 py-4 px-8 text-center">
        <div className="space-y-1">
          <a 
            href="https://oeml.ae"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 text-xs hover:text-emerald-400 transition-colors inline-block"
          >
            © 2026 Offshore Group
          </a>
          <p className="text-neutral-600 text-xs">
            Design & developed by{' '}
            <a 
              href="https://santanudas.co.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-emerald-400 transition-colors"
            >
              ✨
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
