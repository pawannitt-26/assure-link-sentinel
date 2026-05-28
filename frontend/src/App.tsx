import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Header from './components/layout/Header'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DocumentsPage from './pages/DocumentsPage'
import FindingsPage from './pages/FindingsPage'
import PartnersPage from './pages/PartnersPage'
import RunsPage from './pages/RunsPage'
import SchedulesPage from './pages/SchedulesPage'
import SettingsPage from './pages/SettingsPage'

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  if (!token) return <Navigate to="/login" replace />
  return children
}

function ProtectedLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/documents" element={<RequireAuth><DocumentsPage /></RequireAuth>} />
          <Route path="/findings" element={<RequireAuth><FindingsPage /></RequireAuth>} />
          <Route path="/partners" element={<RequireAuth><PartnersPage /></RequireAuth>} />
          <Route path="/runs" element={<RequireAuth><RunsPage /></RequireAuth>} />
          <Route path="/schedules" element={<RequireAuth><SchedulesPage /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
