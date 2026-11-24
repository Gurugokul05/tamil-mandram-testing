import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { RequireAdmin, RequireApproved, RequireAuth } from './components/auth/RouteGuards'
import Home from './pages/Home'
import { About, Events, EventDetail, Gallery, Literature, LiteratureReading } from './pages/PublicPages'
import { Team, Contact } from './pages/TeamContact'
import Auth from './pages/Auth'
import { Membership, Status, Dashboard, ProfilePage, PassPage } from './pages/Member'

const Admin = lazy(() => import('./pages/Admin'))

export default function App() {
  return (
    <Suspense fallback={<div className="page-loader">Loading…</div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:slug" element={<EventDetail />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="literature" element={<Literature />} />
          <Route path="literature/:slug" element={<LiteratureReading />} />
          <Route path="team" element={<Team />} />
          <Route path="contact" element={<Contact />} />
          <Route path="membership" element={<Membership />} />
          <Route path="login" element={<Auth mode="login" />} />
          <Route path="register" element={<Auth mode="register" />} />
          <Route element={<RequireAuth />}>
            <Route path="status" element={<Status />} />
            <Route element={<RequireApproved />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="dashboard/profile" element={<ProfilePage />} />
              <Route path="dashboard/events" element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard/events/:id" element={<PassPage />} />
            </Route>
            <Route element={<RequireAdmin />}>
              <Route path="admin/*" element={<Admin />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
