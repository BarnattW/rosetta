import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import AppLayout from '../components/AppLayout'

function NotFoundContent() {
  const navigate = useNavigate()
  const { token } = useAuthStore()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-7xl font-bold text-zinc-100 mb-2 select-none">404</p>
      <p className="text-zinc-800 font-medium mb-1">Page not found</p>
      <p className="text-sm text-zinc-400 mb-6">This page doesn't exist or was moved.</p>
      <button
        onClick={() => navigate(token ? '/dashboard' : '/')}
        className="bg-zinc-900 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
      >
        {token ? 'Back to Dashboard' : 'Go home'}
      </button>
    </div>
  )
}

export default function NotFound() {
  const { token } = useAuthStore()

  if (token) {
    return (
      <AppLayout>
        <NotFoundContent />
      </AppLayout>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <NotFoundContent />
    </div>
  )
}
