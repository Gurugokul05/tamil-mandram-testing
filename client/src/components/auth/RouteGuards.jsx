import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="page-loader">Loading…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

export function RequireApproved() {
  const { user } = useAuth()
  if (user?.status !== 'approved') return <Navigate to="/status" replace />
  return <Outlet />
}

export function RequireAdmin() {
  const { user } = useAuth()
  if (!['president', 'faculty_coordinator'].includes(user?.role)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
