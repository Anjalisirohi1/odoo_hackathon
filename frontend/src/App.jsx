import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Notifications from './pages/Notifications'
import Assets from './pages/Assets'
import ComingSoon from './pages/ComingSoon'
import ProtectedRoute from './components/ProtectedRoute'

const comingSoonRoutes = [
  { path: '/organization-setup', title: 'Organization Setup' },
  { path: '/allocation-transfer', title: 'Allocation & Transfer' },
  { path: '/resource-booking', title: 'Resource Booking' },
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
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assets"
        element={
          <ProtectedRoute>
            <Assets />
          </ProtectedRoute>
        }
      />
      {comingSoonRoutes.map(({ path, title }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <ComingSoon title={title} />
            </ProtectedRoute>
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
