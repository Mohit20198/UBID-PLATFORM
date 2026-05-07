import { NavLink, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/review',    label: 'Review Queue' },
  { to: '/lookup',    label: 'UBID Lookup' },
  { to: '/activity',  label: 'Activity Monitor' },
  { to: '/query',     label: 'Cross-Dept Query' },
  { to: '/audit',     label: 'Audit Log' },
]

export default function Navbar() {
  const [ollamaOk, setOllamaOk] = useState(null)
  const [pendingCount, setPendingCount] = useState(null)

  useEffect(() => {
    fetch('/api/ollama-status').then(r => r.json()).then(d => setOllamaOk(d)).catch(() => {})
    fetch('/api/stats').then(r => r.json()).then(d => setPendingCount(d.pending_review)).catch(() => {})
  }, [])

  return (
    <nav className="topnav">
      <Link to="/" className="topnav-brand">
        <div className="brand-icon" style={{ fontSize: 13, fontWeight: 900, letterSpacing: -0.5 }}>U</div>
        <div className="brand-text">
          <h1>UBID Platform</h1>
          <p>Karnataka Commerce &amp; Industry</p>
        </div>
      </Link>

      <div className="topnav-nav">
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {label}
            {to === '/review' && pendingCount > 0 && (
              <span className="nav-badge-count">{pendingCount}</span>
            )}
          </NavLink>
        ))}
      </div>

      <div className="topnav-right">
        {ollamaOk !== null && (
          <div className="ollama-dot">
            <div className={`dot${ollamaOk.available ? '' : ' offline'}`} />
            <span>{ollamaOk.available ? `Phi-3 · Live` : 'Ollama offline'}</span>
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: 'var(--accent)' }}>AI for Bharat 2026</div>
          <div>Round 2 Prototype</div>
        </div>
      </div>
    </nav>
  )
}
