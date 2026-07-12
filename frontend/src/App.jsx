import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Notifications from './pages/Notifications'
import Assets from './pages/Assets'
import OrganizationSetup from './pages/OrganizationSetup'
import ResourceBooking from './pages/ResourceBooking'
import Reports from './pages/Reports'
import AllocationTransfer from './pages/AllocationTransfer'
import ComingSoon from './pages/ComingSoon'
import ProtectedRoute from './components/ProtectedRoute'

const comingSoonRoutes = [
  { path: '/maintenance', title: 'Maintenance' },
  { path: '/audit', title: 'Audit' },
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
      <Route
        path="/organization-setup"
        element={
          <ProtectedRoute>
            <OrganizationSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resource-booking"
        element={
          <ProtectedRoute>
            <ResourceBooking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/allocation-transfer"
        element={
          <ProtectedRoute>
            <AllocationTransfer />
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
