import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import ReviewerWorkbench from './pages/ReviewerWorkbench'
import UBIDLookup from './pages/UBIDLookup'
import ActivityMonitor from './pages/ActivityMonitor'
import CrossDeptQuery from './pages/CrossDeptQuery'
import AuditLog from './pages/AuditLog'

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/review"   element={<ReviewerWorkbench />} />
          <Route path="/lookup"   element={<UBIDLookup />} />
          <Route path="/activity" element={<ActivityMonitor />} />
          <Route path="/query"    element={<CrossDeptQuery />} />
          <Route path="/audit"    element={<AuditLog />} />
        </Routes>
      </main>
    </div>
  )
}