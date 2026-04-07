import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function decodeToken(token: string): { sub: string; email: string } | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

interface AuthState {
  token: string | null
  userId: string | null
  email: string | null
  setAuth: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      email: null,
      setAuth: (token) => {
        const claims = decodeToken(token)
        localStorage.setItem('token', token)
        set({ token, userId: claims?.sub ?? null, email: claims?.email ?? null })
      },
      clearAuth: () => {
        localStorage.removeItem('token')
        set({ token: null, userId: null, email: null })
      },
    }),
    { name: 'auth' }
  )
)
