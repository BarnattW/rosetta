import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'

const navItems = [
  {
    label: 'Videos',
    to: '/dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
    ),
  },
  {
    label: 'Billing',
    to: '/billing',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function SideNav() {
  const { email, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    clearAuth()
    navigate('/')
    authApi.logout().catch(() => {})
  }

  return (
    <aside className="w-56 h-screen bg-zinc-950 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Rosetta</span>
        </div>
      </div>

      {/* Upload button */}
      <div className="px-3 py-3">
        <NavLink
          to="/upload"
          className="flex items-center justify-center gap-2 w-full bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Video
        </NavLink>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-1 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-zinc-800">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <p className="flex-1 min-w-0 text-xs text-zinc-400 truncate">{email}</p>
          <button
            onClick={handleLogout}
            title="Logout"
            className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
