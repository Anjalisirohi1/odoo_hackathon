
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Notifications from './pages/Notifications'
import ComingSoon from './pages/ComingSoon'
import DashboardLayout from './components/dashboard/DashboardLayout'
import ResourceBooking from './ResourceBooking'

const comingSoonRoutes = [
  { path: '/organization-setup', title: 'Organization Setup' },
  { path: '/assets', title: 'Assets' },
  { path: '/allocation-transfer', title: 'Allocation & Transfer' },
  { path: '/maintenance', title: 'Maintenance' },
  { path: '/audit', title: 'Audit' },
  { path: '/reports', title: 'Reports' },
]

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        }
      />
      <Route
        path="/notifications"
        element={
          <DashboardLayout>
            <Notifications />
          </DashboardLayout>
        }
      />

      <Route
        path="/resource-booking"
        element={
          <DashboardLayout>
            <ResourceBooking />
          </DashboardLayout>
        }
      />
      {comingSoonRoutes.map(({ path, title }) => (
        <Route key={path} path={path} element={<ComingSoon title={title} />} />
      ))}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App

