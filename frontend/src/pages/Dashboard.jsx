import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'

const STATUS_COLORS = { ACTIVE: '#22c55e', DORMANT: '#f59e0b', CLOSED: '#ef4444' }

function StatCard({ label, value, sub, accent, tooltip, onClick }) {
  return (
    <div className="stat-card" data-tooltip={tooltip} onClick={onClick} style={{ ...(accent ? { borderColor: 'rgba(255,153,51,0.3)' } : {}), cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: 'var(--accent)' } : {}}>{value ?? '—'}</div>
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
  if (!stats)  return <div className="loading">Backend not reachable — start FastAPI on port 8000</div>

  const pieData = Object.entries(stats.status_breakdown || {}).map(([name, value]) => ({ name, value }))
  const srcData  = Object.entries(stats.source_coverage || {}).map(([name, value]) => ({ name, value }))
  const linkRate = stats.total_records > 0
    ? ((stats.auto_linked_pairs * 2) / stats.total_records * 100).toFixed(1) : 0

  return (
    <div>
      <div className="page-header">
        <h2>Platform Dashboard</h2>
        <p>Live overview of UBID entity resolution and business activity classification across Karnataka</p>
      </div>

      {/* Ollama status */}
      {ollamaOk !== null && (
        <div style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 8,
          background: ollamaOk.available ? 'var(--active-dim)' : 'var(--dormant-dim)',
          border: `1px solid ${ollamaOk.available ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
          fontSize: 12, color: ollamaOk.available ? 'var(--active)' : 'var(--dormant)',
          display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          {ollamaOk.available
            ? `Ollama connected — models: ${ollamaOk.models.slice(0,3).join(', ')}`
            : 'Ollama not reachable — AI explanations will use rule-based fallback'}
        </div>
      )}

      <div className="stats-grid">
        <StatCard label="Unique UBIDs"       value={stats.total_ubids?.toLocaleString()}   sub="Distinct real-world businesses" accent tooltip="The number of unique business entities successfully grouped under a single Unified Business Identifier." />
        <StatCard label="Source Records"     value={stats.total_records?.toLocaleString()}  sub="Across 4 department systems" tooltip="The total number of raw records ingested across all connected department systems. Click to view raw data." onClick={openSourcesModal} />
        <StatCard label="Auto-Linked Pairs"  value={stats.auto_linked_pairs?.toLocaleString()} sub="Confidence >= 85% with identifier" tooltip="Pairs of records grouped automatically by the AI with high confidence." />
        <StatCard label="Pending Review"     value={stats.pending_review}                   sub="Ambiguous pairs 55–84%" tooltip="Ambiguous matches that require manual verification by a human reviewer." />
        <StatCard label="Confirmed Merges"   value={stats.confirmed_merges}                 sub="Human-verified decisions" tooltip="Record pairs manually approved and merged by a reviewer." />
        <StatCard label="Unattributed Events" value={stats.unattributed_events}             sub="Events without UBID match" tooltip="Activity events (e.g. tax filings or inspections) that could not be matched to any known business." />
      </div>

      <div className="two-col" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="section-title">Business Activity Status</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                  {pieData.map(entry => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#131630', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No activity data yet</p></div>}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
            {pieData.map(({ name, value }) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <div className={`badge badge-${name.toLowerCase()}`}>{name}</div>
                <div style={{ fontWeight: 700, fontSize: 20, marginTop: 4 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title">Source System Coverage</div>
          {srcData.map(({ name, value }) => {
            const pct = stats.total_records > 0 ? (value / stats.total_records * 100).toFixed(0) : 0
            return (
              <div key={name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{value} records ({pct}%)</span>
                </div>
                <div className="conf-bar-wrap">
                  <div className="conf-bar-fill" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            )
          })}
          <div className="divider" />
          <div style={{ textAlign: 'center' }}>
            <div className="stat-label">Auto-Link Coverage Rate</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>{linkRate}%</div>
            <div className="stat-sub">of records in an auto-linked cluster</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Quick Actions</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/review" className="btn btn-primary">Review Queue ({stats.pending_review} pending)</Link>
          <Link to="/query"  className="btn btn-ghost">Run Inspection-Gap Query</Link>
          <Link to="/lookup" className="btn btn-ghost">UBID Lookup</Link>
          <Link to="/audit"  className="btn btn-ghost">View Audit Log</Link>
        </div>
      </div>

      {showSourcesModal && (
        <div className="modal-backdrop" onClick={() => setShowSourcesModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Raw Source Records</h3>
              <button className="btn btn-ghost" onClick={() => setShowSourcesModal(false)}>Close</button>
            </div>
            
            {!sourcesData ? (
              <div className="loading">Loading raw records...</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 8 }}>
                  {Object.keys(sourcesData).map(src => (
                    <button 
                      key={src}
                      className={`btn ${activeTab === src ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setActiveTab(src)}
                    >
                      {src} ({sourcesData[src].length})
                    </button>
                  ))}
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Business Name</th>
                        <th>Address</th>
                        <th>PIN</th>
                        <th>PAN</th>
                        <th>GSTIN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sourcesData[activeTab]?.map((row, i) => (
                        <tr key={i}>
                          <td className="primary">{row.unique_id}</td>
                          <td>{row.business_name}</td>
                          <td>{row.address}</td>
                          <td>{row.pin_code}</td>
                          <td>{row.pan || '-'}</td>
                          <td>{row.gstin || '-'}</td>
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
