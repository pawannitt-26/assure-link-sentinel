import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'

const PUBLIC_NAV = [
  /* none */
]

const AUTH_NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/documents', label: 'Documents' },
  { to: '/findings', label: 'Findings' },
  { to: '/partners', label: 'Partners' },
  { to: '/runs', label: 'Runs' },
  { to: '/schedules', label: 'Schedules' },
  { to: '/settings', label: 'Settings' },
]

function useIsAuthenticated() {
  const location = useLocation()
  const read = () =>
    typeof localStorage !== 'undefined' && !!localStorage.getItem('token')
  const [isAuthenticated, setIsAuthenticated] = useState(read)
  useEffect(() => {
    setIsAuthenticated(read())
  }, [location.pathname])
  return isAuthenticated
}

export default function Header() {
  const isAuthenticated = useIsAuthenticated()
  const items = isAuthenticated ? [...PUBLIC_NAV, ...AUTH_NAV] : PUBLIC_NAV
  return (
    <header className="w-full shrink-0 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 md:px-6">
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/" className="text-lg font-bold text-blue-600 hover:text-blue-700">
            App
          </Link>
        </div>
        <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:gap-3" aria-label="Main">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => 'rounded-md px-3 py-2 text-sm font-bold transition-colors ' + (isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}