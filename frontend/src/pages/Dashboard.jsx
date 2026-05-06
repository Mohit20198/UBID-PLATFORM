import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Link } from 'react-router-dom'

const STATUS_COLORS = { ACTIVE: '#22c55e', DORMANT: '#f59e0b', CLOSED: '#ef4444' }

const CUSTOM_TOOLTIP = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border-mid)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{payload[0].name}</div>
      <div style={{ color: payload[0].fill, fontWeight: 600 }}>{payload[0].value?.toLocaleString()}</div>
    </div>
  )
}

function StatCard({ label, value, sub, accent, tooltip, onClick, icon, color }) {
  return (
    <div className="stat-card" data-tooltip={tooltip}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', borderColor: accent ? 'rgba(255,153,51,0.2)' : '' }}>
      <div className="stat-icon" style={{ color: color || 'var(--accent)' }}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className={`stat-value${accent ? ' accent' : ''}`}>{value ?? '—'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ollamaOk, setOllamaOk] = useState(null)
  const [showSourcesModal, setShowSourcesModal] = useState(false)
  const [sourcesData, setSourcesData] = useState(null)
  const [activeTab, setActiveTab] = useState('BBMP')

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false) }).catch(() => setLoading(false))
    fetch('/api/ollama-status').then(r => r.json()).then(d => setOllamaOk(d)).catch(() => {})
  }, [])

  const openSourcesModal = () => {
    setShowSourcesModal(true)
    if (!sourcesData) {
      fetch('/api/raw-sources').then(r => r.json()).then(d => setSourcesData(d))
    }
  }

  if (loading) return <div className="loading">Loading dashboard...</div>
  if (!stats) return (
    <div className="empty-state" style={{ paddingTop: 100 }}>
      <div className="empty-icon">⚠️</div>
      <p>Backend not reachable — start FastAPI on port 8000</p>
    </div>
  )

  const pieData = Object.entries(stats.status_breakdown || {}).map(([name, value]) => ({ name, value }))
  const srcData = Object.entries(stats.source_coverage || {}).map(([name, value]) => ({ name, value }))
  const linkRate = stats.total_records > 0
    ? ((stats.auto_linked_pairs * 2) / stats.total_records * 100).toFixed(1) : 0

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <div className="page-header-badge">⬡ Live Platform</div>
            <h2>Platform Dashboard</h2>
            <p>Live overview of UBID entity resolution and business activity classification across Karnataka</p>
          </div>
          {ollamaOk !== null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              borderRadius: 999, border: `1px solid ${ollamaOk.available ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
              background: ollamaOk.available ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)',
              fontSize: 12, color: ollamaOk.available ? 'var(--active)' : 'var(--dormant)',
              height: 'fit-content'
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block', boxShadow: '0 0 6px currentColor' }} />
              {ollamaOk.available
                ? `Ollama connected — ${ollamaOk.models?.slice(0, 2).join(', ')}`
                : 'Ollama offline — using rule-based fallback'}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon="🔗" label="Unique UBIDs"        value={stats.total_ubids?.toLocaleString()}          sub="Distinct real-world businesses" accent tooltip="Unique business entities grouped under a UBID." color="var(--accent)" />
        <StatCard icon="📂" label="Source Records"      value={stats.total_records?.toLocaleString()}         sub="Across 4 department systems" tooltip="Total raw records ingested. Click to explore." onClick={openSourcesModal} color="var(--blue)" />
        <StatCard icon="⚡" label="Auto-Linked Pairs"   value={stats.auto_linked_pairs?.toLocaleString()}     sub="Confidence ≥ 85%" tooltip="Pairs grouped automatically by the AI engine." color="#a855f7" />
        <StatCard icon="⚑" label="Pending Review"       value={stats.pending_review}                          sub="Ambiguous pairs 55–84%" tooltip="Pairs flagged for human review." color="var(--dormant)" />
        <StatCard icon="✓" label="Confirmed Merges"     value={stats.confirmed_merges}                        sub="Human-verified decisions" tooltip="Pairs manually approved by reviewers." color="var(--active)" />
        <StatCard icon="⚠" label="Unattributed Events" value={stats.unattributed_events}                      sub="Events without UBID match" tooltip="Activity events with no known business match." color="var(--closed)" />
      </div>

      <div className="two-col" style={{ marginBottom: 24 }}>
        {/* Pie Chart */}
        <div className="card">
          <div className="section-title">Business Activity Status</div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {pieData.map(entry => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12 }}>
                {pieData.map(({ name, value }) => (
                  <div key={name} style={{ textAlign: 'center' }}>
                    <div className={`badge badge-${name.toLowerCase()}`}>{name}</div>
                    <div style={{ fontWeight: 800, fontSize: 22, marginTop: 6, color: STATUS_COLORS[name] }}>{value?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="empty-state"><p>No activity data yet</p></div>}
        </div>

        {/* Source Coverage */}
        <div className="card">
          <div className="section-title">Source System Coverage</div>
          {srcData.map(({ name, value }) => {
            const pct = stats.total_records > 0 ? (value / stats.total_records * 100).toFixed(0) : 0
            const colors = { ESCOM: 'var(--blue)', BBMP: 'var(--accent)', LABOUR: 'var(--active)', FACTORIES: '#a855f7' }
            return (
              <div key={name} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[name] || 'var(--accent)', display: 'inline-block' }} />
                    {name}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{value?.toLocaleString()} records ({pct}%)</span>
                </div>
                <div className="conf-bar-wrap">
                  <div className="conf-bar-fill" style={{ width: `${pct}%`, background: colors[name] || 'var(--accent)' }} />
                </div>
              </div>
            )
          })}
          <div className="glow-line" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="stat-label">Auto-Link Coverage</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', letterSpacing: -1 }}>{linkRate}%</div>
              <div className="stat-sub">of records in a linked cluster</div>
            </div>
            <div style={{ fontSize: 48, opacity: 0.12 }}>⚡</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="section-title">Quick Actions</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/review" className="btn btn-primary">
            ⚑ Review Queue
            {stats.pending_review > 0 && <span className="nav-badge-count">{stats.pending_review}</span>}
          </Link>
          <Link to="/query"    className="btn btn-ghost">⊞ Run Cross-Dept Query</Link>
          <Link to="/lookup"   className="btn btn-ghost">⌖ UBID Lookup</Link>
          <Link to="/activity" className="btn btn-ghost">◈ Activity Monitor</Link>
          <Link to="/audit"    className="btn btn-ghost">≡ Audit Log</Link>
        </div>
      </div>

      {/* Sources Modal */}
      {showSourcesModal && (
        <div className="modal-backdrop" onClick={() => setShowSourcesModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Space Grotesk, sans-serif' }}>Raw Source Records</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Ingested from all 4 department systems</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSourcesModal(false)}>✕ Close</button>
            </div>
            {!sourcesData ? (
              <div className="loading">Loading raw records...</div>
            ) : (
              <>
                <div className="filter-tabs" style={{ marginBottom: 16 }}>
                  {Object.keys(sourcesData).map(src => (
                    <button key={src} className={`filter-tab${activeTab === src ? ' active' : ''}`} onClick={() => setActiveTab(src)}>
                      {src} <span style={{ opacity: 0.6 }}>({sourcesData[src].length})</span>
                    </button>
                  ))}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead><tr>
                      <th>ID</th><th>Business Name</th><th>Address</th><th>PIN</th><th>PAN</th><th>GSTIN</th>
                    </tr></thead>
                    <tbody>
                      {sourcesData[activeTab]?.slice(0, 100).map((row, i) => (
                        <tr key={i}>
                          <td className="primary" style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.unique_id}</td>
                          <td className="primary">{row.business_name}</td>
                          <td>{row.address}</td>
                          <td>{row.pin_code}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.pan || '—'}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.gstin || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
