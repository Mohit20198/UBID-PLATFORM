import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/',         label: 'Dashboard' },
  { to: '/review',   label: 'Review Queue' },
  { to: '/lookup',   label: 'UBID Lookup' },
  { to: '/activity', label: 'Activity Monitor' },
  { to: '/query',    label: 'Cross-Dept Query' },
  { to: '/audit',    label: 'Audit Log' },
]

export default function Navbar() {
  return (
    <nav className="topnav">
      <div className="topnav-brand">
        <h1>UBID Platform</h1>
        <p>Karnataka Commerce &amp; Industry</p>
      </div>

      <div className="topnav-nav">
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </div>

      <div className="topnav-footer">
        <div>Round 2 Prototype</div>
        <strong>AI for Bharat 2026</strong>
      </div>
    </nav>
  )
}
