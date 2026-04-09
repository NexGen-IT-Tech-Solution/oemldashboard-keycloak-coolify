import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Loader2, User, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import logoImg from '@/assets/logos/OverAll.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        navigate('/dashboard', { replace: true })
      }
    }
    checkExistingSession()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const { error: supabaseError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (supabaseError) {
      setError(supabaseError.message)
      setIsSubmitting(false)
    } else {
      navigate('/dashboard')
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-300 ml-1 block mb-1.5">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-neutral-500">
                <User className="w-5 h-5" />
              </div>
              <input
                type="email"
                className="w-full bg-neutral-950/50 border border-neutral-800 text-neutral-100 rounded-xl pl-12 p-3.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-300 ml-1 block mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-neutral-500">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                className="w-full bg-neutral-950/50 border border-neutral-800 text-neutral-100 rounded-xl pl-12 p-3.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold rounded-xl py-3.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing in...</>
            ) : 'Sign In'}
          </button>
        </form>

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
