import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import './LandingPage.css'

const FEATURES = [
  { icon: 'AI', title: 'AI Entity Resolution', desc: 'Probabilistic Splink/Fellegi-Sunter engine groups fragmented records across BBMP, ESCOM, Labour, and Factories into a single ground truth.', color: '#FF9933' },
  { icon: 'SG', title: 'Activity Lifecycle', desc: 'Time-decayed signal scoring automatically classifies each business as ACTIVE, DORMANT, or CLOSED — updated daily.', color: '#22c55e' },
  { icon: 'QR', title: 'Cross-Dept Query', desc: 'Find all active factories in a pin code with no inspection in 18 months — a query that was impossible before UBID.', color: '#4A90E2' },
  { icon: 'LM', title: 'LLM Explanations', desc: 'Local Phi-3 via Ollama explains every AI match decision in plain English, keeping sensitive data on-premise.', color: '#a855f7' },
  { icon: 'RV', title: 'Reviewer Workbench', desc: 'Human-in-the-loop review for ambiguous matches (55–84% confidence) with AI assistance and full audit trails.', color: '#f59e0b' },
  { icon: 'AL', title: 'Immutable Audit Log', desc: 'Every system and human decision is logged. Full traceability for government compliance.', color: '#ef4444' },
]

const STATS = [
  { value: '878', label: 'Unique Business IDs', suffix: '' },
  { value: '1876', label: 'Source Records Linked', suffix: '' },
  { value: '77', label: 'Auto-Link Rate', suffix: '%' },
  { value: '4', label: 'Departments Connected', suffix: '' },
]

const DEPTS = [
  { name: 'BBMP', full: 'Trade Licences', color: '#FF9933' },
  { name: 'ESCOM', full: 'Electricity', color: '#4A90E2' },
  { name: 'LABOUR', full: 'PF & Labour', color: '#22c55e' },
  { name: 'FACTORIES', full: 'Factories Act', color: '#a855f7' },
]

const LANDING_NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/review', label: 'Review Queue' },
  { to: '/lookup', label: 'UBID Lookup' },
  { to: '/query', label: 'Cross-Dept Query' },
  { to: '/audit', label: 'Audit Log' },
]

function AnimatedCounter({ target, suffix }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const num = parseFloat(target.replace(/,/g, ''))
        let start = 0
        const step = num / 60
        const timer = setInterval(() => {
          start += step
          if (start >= num) { setVal(num); clearInterval(timer) }
          else setVal(start)
        }, 16)
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  const display = target.includes(',') || parseInt(target) > 999
    ? Math.round(val).toLocaleString()
    : (target.includes('.') ? val.toFixed(1) : Math.round(val))

  return <span ref={ref}>{display}{suffix}</span>
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <div className="landing">

      {/* ── Landing Navbar ── */}
      <header className={`landing-nav${scrolled ? ' landing-nav-scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <Link to="/" className="landing-nav-brand">
            <div className="landing-brand-icon">U</div>
            <span>UBID Platform</span>
          </Link>
          <div className="landing-nav-sep" />
          <nav className="landing-nav-links">
            {LANDING_NAV.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => `landing-nav-link${isActive ? ' landing-nav-active' : ''}`}>
                {label}
              </NavLink>
            ))}
          </nav>
          <Link to="/dashboard" className="landing-nav-cta">Open Platform</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid" />
          <div className="hero-orb orb1" />
          <div className="hero-orb orb2" />
          <div className="hero-orb orb3" />
        </div>
        <div className="hero-content">
          <div className="hero-eyebrow animate-in" style={{ animationDelay: '0s' }}>
            <span className="eyebrow-dot" />
            AI for Bharat 2026 — Karnataka Prototype
          </div>
          <h1 className="hero-title animate-in" style={{ animationDelay: '0.1s' }}>
            One ID to rule<br />
            <span className="gradient-text">every business</span>
          </h1>
          <p className="hero-desc animate-in" style={{ animationDelay: '0.2s' }}>
            The Unified Business Identifier Platform uses AI-driven entity resolution to link
            fragmented government records across Karnataka's departments — creating a single,
            authoritative identity for every business.
          </p>
          <div className="hero-actions animate-in" style={{ animationDelay: '0.3s' }}>
            <Link to="/dashboard" className="btn-hero-primary">Open Dashboard</Link>
            <Link to="/about" className="btn-hero-ghost">Learn More</Link>
          </div>
          <div className="hero-dept-flow animate-in" style={{ animationDelay: '0.4s' }}>
            {DEPTS.map((d, i) => (
              <div key={d.name} className="dept-pill" style={{ '--c': d.color, animationDelay: `${0.5 + i * 0.08}s` }}>
                <span>{d.name}</span>
              </div>
            ))}
            <div className="flow-arrow">→</div>
            <div className="ubid-pill">
              <span>UBID</span>
            </div>
          </div>
        </div>
        <div className="hero-scroll-hint">
          <div className="scroll-dot" />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="stats-section-inner">
          {STATS.map((s, i) => (
            <div key={i} className="landing-stat">
              <div className="landing-stat-value">
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </div>
              <div className="landing-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section">
        <div className="section-inner">
          <div className="section-label">How it works</div>
          <h2 className="section-title-lg">From 4 silos to one truth</h2>
          <p className="section-desc">UBID ingests raw, messy records from disconnected government systems and resolves them into a unified business registry using probabilistic AI.</p>

          <div className="pipeline">
            {[
              { step: '01', title: 'Ingest', desc: 'Raw records pulled from BBMP, ESCOM, Labour & Factories with varying formats and completeness.' },
              { step: '02', title: 'Normalise', desc: 'Names, addresses and identifiers are cleaned, standardised and deduplicated.' },
              { step: '03', title: 'Resolve', desc: 'Splink probabilistic engine compares blocking candidates and assigns match confidence scores.' },
              { step: '04', title: 'Link', desc: 'High-confidence pairs (≥85%) are auto-linked. Ambiguous pairs go to human review.' },
              { step: '05', title: 'Monitor', desc: 'Signal decay models continuously infer business lifecycle: Active, Dormant, or Closed.' },
            ].map((p, i) => (
              <div key={i} className="pipeline-step">
                <div className="pipeline-step-num">{p.step}</div>
                <div className="pipeline-step-title">{p.title}</div>
                <div className="pipeline-step-desc">{p.desc}</div>
                {i < 4 && <div className="pipeline-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section section-dark">
        <div className="section-inner">
          <div className="section-label">Platform Features</div>
          <h2 className="section-title-lg">Built for government-grade intelligence</h2>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{ '--fc': f.color }}>
                <div className="feature-icon-badge" style={{ background: `${f.color}18`, color: f.color, border: `1px solid ${f.color}30` }}>{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">UBID Platform</div>
            <div className="footer-tagline">Karnataka Commerce & Industry · AI for Bharat 2026</div>
          </div>
          <div className="footer-links">
            <Link to="/about">About</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/review">Review Queue</Link>
            <Link to="/lookup">UBID Lookup</Link>
            <Link to="/activity">Activity Monitor</Link>
            <Link to="/query">Cross-Dept Query</Link>
            <Link to="/audit">Audit Log</Link>
          </div>
        </div>
        <div className="footer-bottom">Built with FastAPI · React · Splink · Phi-3 (Ollama) · All data stays on-premise.</div>
      </footer>
    </div>
  )
}
