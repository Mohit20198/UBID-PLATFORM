import { useEffect, useState } from 'react'

function StatusBadge({ s }) {
  const cls = { ACTIVE:'badge-active', DORMANT:'badge-dormant', CLOSED:'badge-closed', UNKNOWN:'badge-system' }
  return <span className={`badge ${cls[s]||'badge-system'}`}>{s}</span>
}

export default function ActivityMonitor() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('')
  const [pin, setPin]         = useState('')
  const [expanded, setExpanded] = useState(null)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (pin)    params.set('pin_code', pin)
    params.set('limit', '100')
    fetch(`/api/activity?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="page-header">
        <h2>Activity Monitor</h2>
        <p>Business activity classification — Active, Dormant, or Closed — with evidence breakdown per UBID</p>
      </div>

      <div className="card" style={{ marginBottom:20, display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:160 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>STATUS</div>
          <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DORMANT">Dormant</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div style={{ flex:1, minWidth:160 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>PIN CODE</div>
          <select className="input" value={pin} onChange={e=>setPin(e.target.value)}>
            <option value="">All Pin Codes</option>
            <option value="560058">560058 — Peenya</option>
            <option value="560100">560100 — Electronic City</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={load}>Apply Filters</button>
      </div>

      {loading && <div className="loading">Loading classifications...</div>}

      {!loading && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table className="data-table">
            <thead><tr>
              <th>UBID</th><th>Business Name</th><th>Status</th>
              <th>Confidence</th><th>Last Signal</th><th>Sources</th><th></th>
            </tr></thead>
            <tbody>
              {data.map(row => (
                <>
                  <tr key={row.ubid}>
                    <td className="primary" style={{ fontFamily:'monospace', fontSize:12 }}>{row.ubid}</td>
                    <td className="primary">{row.business_name||'—'}</td>
                    <td><StatusBadge s={row.activity_status} /></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontWeight:600, color: row.confidence_pct>=70?'var(--active)':'var(--dormant)' }}>
                          {row.confidence_pct}%
                        </span>
                        <div className="conf-bar-wrap" style={{ width:50 }}>
                          <div className="conf-bar-fill" style={{ width:`${row.confidence_pct}%`,
                            background: row.activity_status==='ACTIVE'?'var(--active)':row.activity_status==='DORMANT'?'var(--dormant)':'var(--closed)' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:12 }}>{row.last_signal_date||'—'}</td>
                    <td>
                      {(row.sources_active||[]).map(s => (
                        <span key={s} className="badge badge-system" style={{ fontSize:9, marginRight:3 }}>{s}</span>
                      ))}
                    </td>
                    <td>
                      {row.evidence?.length > 0 && (
                        <button className="btn btn-ghost" style={{ fontSize:11, padding:'3px 8px' }}
                          onClick={()=>setExpanded(expanded===row.ubid?null:row.ubid)}>
                          {expanded===row.ubid?'Hide':`${row.evidence.length} signals`}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded===row.ubid && (
                    <tr>
                      <td colSpan={7} style={{ background:'var(--bg-hover)', padding:'12px 20px' }}>
                        <div className="section-title" style={{ marginBottom:8 }}>Evidence Signals</div>
                        {row.evidence.map((ev,i) => (
                          <div key={i} style={{ display:'flex', gap:16, padding:'4px 0',
                            borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12 }}>
                            <span style={{ color:'var(--accent)', fontWeight:600, minWidth:160 }}>{ev.event}</span>
                            <span style={{ color:'var(--text-muted)', minWidth:70 }}>{ev.source}</span>
                            <span style={{ color:'var(--text-secondary)' }}>{ev.date}</span>
                            <span style={{ color:'var(--text-muted)' }}>{ev.days_ago}d ago</span>
                            <span style={{ fontWeight:600, color:'var(--active)' }}>wt: {ev.decayed_weight}</span>
                          </div>
                        ))}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {data.length===0 && <div className="empty-state" style={{ padding:40 }}><p>No data matches your filters</p></div>}
        </div>
      )}
      <div style={{ marginTop:10, fontSize:12, color:'var(--text-muted)' }}>Showing {data.length} businesses</div>
    </div>
  )
}
