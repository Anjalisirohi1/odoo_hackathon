import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ComingSoon from './pages/ComingSoon'

const comingSoonRoutes = [
  { path: '/organization-setup', title: 'Organization Setup' },
  { path: '/assets', title: 'Assets' },
  { path: '/allocation-transfer', title: 'Allocation & Transfer' },
  { path: '/resource-booking', title: 'Resource Booking' },
  { path: '/maintenance', title: 'Maintenance' },
  { path: '/audit', title: 'Audit' },
  { path: '/reports', title: 'Reports' },
  { path: '/notifications', title: 'Notifications' },
]

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {comingSoonRoutes.map(({ path, title }) => (
        <Route key={path} path={path} element={<ComingSoon title={title} />} />
      ))}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
