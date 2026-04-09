import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import keycloak from '@/lib/keycloak/client'
import { isAuthenticated } from '@/lib/keycloak/authService'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Roles from './pages/Roles'
import PortalSettings from './pages/PortalSettings'
import Layout from './components/Layout'

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-neutral-950">
      <div className="w-8 h-8 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await keycloak.init({
          onLoad: 'check-sso',
          checkLoginIframe: false,
        })
        setAuthenticated(authenticated || false)
      } catch (error) {
        console.error('Auth check failed:', error)
        setAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  return authenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedRoute>
            <Layout>
              <Roles />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/portal"
        element={
          <ProtectedRoute>
            <Layout>
              <PortalSettings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
