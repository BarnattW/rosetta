import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = mode === 'login'
        ? await authApi.login(email, password)
        : await authApi.register(email, password)
      setAuth(res.accessToken)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm px-4">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-zinc-900 tracking-tight">Rosetta</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
          <h1 className="text-base font-semibold text-zinc-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-zinc-400 mb-6">
            {mode === 'login' ? 'Sign in to continue' : 'Start translating videos for free'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-zinc-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-zinc-400"
            />
            {error && (
              <p className="text-red-500 text-sm flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors mt-1"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-400 mt-5">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
              className="text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
