import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import CursorParticles from './components/CursorParticles'
import DotGridCanvas from './components/DotGridCanvas'
import LandingPage from './pages/LandingPage'
import AboutPage from './pages/AboutPage'
import Dashboard from './pages/Dashboard'
import ReviewerWorkbench from './pages/ReviewerWorkbench'
import UBIDLookup from './pages/UBIDLookup'
import ActivityMonitor from './pages/ActivityMonitor'
import CrossDeptQuery from './pages/CrossDeptQuery'
import AuditLog from './pages/AuditLog'

export default function App() {
  const loc = useLocation()
  const isLanding = loc.pathname === '/' || loc.pathname === '/about'

  return (
    <div className="app-shell">
      <DotGridCanvas />
      <CursorParticles />
      {!isLanding && <Navbar />}
      <main className={isLanding ? 'main-content full-width' : 'main-content'}>
        <Routes>
          <Route path="/"          element={<LandingPage />} />
          <Route path="/about"     element={<AboutPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/review"    element={<ReviewerWorkbench />} />
          <Route path="/lookup"    element={<UBIDLookup />} />
          <Route path="/activity"  element={<ActivityMonitor />} />
          <Route path="/query"     element={<CrossDeptQuery />} />
          <Route path="/audit"     element={<AuditLog />} />
        </Routes>
      </main>
    </div>
  )
}