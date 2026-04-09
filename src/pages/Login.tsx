import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Loader2 } from 'lucide-react'
import keycloak from '@/lib/keycloak/client'
import logoImg from '@/assets/logos/OverAll.png'

export default function Login() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const initAndCheckAuth = async () => {
      try {
        const authenticated = await keycloak.init({
          onLoad: 'check-sso',
          checkLoginIframe: false,
        })

        if (authenticated) {
          navigate('/dashboard', { replace: true })
        }
      } catch (err) {
        console.error('Keycloak init error:', err)
      }
    }
    initAndCheckAuth()
  }, [navigate])

  const handleLogin = async () => {
    setError('')
    setIsLoading(true)

    try {
      await keycloak.init({
        onLoad: 'login-required',
        checkLoginIframe: false,
      })
      keycloak.login()
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to connect to authentication server. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/40 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/40 rounded-full blur-[120px]" />

      <div className="w-full max-w-md p-6 relative z-10 bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-3xl shadow-2xl">
        <div className="flex justify-center -mt-4">
          <div className="relative w-48 h-48">
            <img 
              src={logoImg}
              alt="Offshore Group"
              className="object-contain w-full h-full"
            />
          </div>
        </div>

        <div className="text-center -mt-3 mb-0">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Offshore Group Dashboard
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-900/50 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold rounded-xl py-3.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Connecting...</>
          ) : 'Sign In to Dashboard'}
        </button>

        <div className="mt-6 pt-4 border-t border-neutral-800 text-center space-y-2">
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
      </div>
    </div>
  )
}
