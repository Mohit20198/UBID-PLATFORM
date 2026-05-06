import { useState } from 'react'

function StatusBadge({ s }) {
  const cls = { ACTIVE:'badge-active', DORMANT:'badge-dormant', CLOSED:'badge-closed', UNKNOWN:'badge-system' }
  return <span className={`badge ${cls[s]||'badge-system'}`}>{s}</span>
}

const PRESET_QUERIES = [
  { label: 'Active factories — no inspection in 18 months (560058)',
    params: { pin_code:'560058', status:'ACTIVE', source_system:'FACTORIES', no_inspection_months:18 } },
  { label: 'All active businesses in Electronic City (560100)',
    params: { pin_code:'560100', status:'ACTIVE' } },
  { label: 'Dormant businesses in Peenya (560058)',
    params: { pin_code:'560058', status:'DORMANT' } },
  { label: 'Closed businesses across all pin codes',
    params: { status:'CLOSED' } },
]

export default function CrossDeptQuery() {
  const [form, setForm]        = useState({ pin_code:'', status:'', source_system:'', no_inspection_months:'' })
  const [results, setResults]  = useState(null)
  const [loading, setLoading]  = useState(false)
  const [ran, setRan]          = useState(false)
  const [activePreset, setActivePreset] = useState(null)

  const run = async (overrideParams) => {
    const p = overrideParams || form
    setLoading(true); setRan(true)
    const params = new URLSearchParams()
    Object.entries(p).forEach(([k,v]) => { if (v!==''&&v!=null) params.set(k,v) })
    const data = await fetch(`/api/query?${params}`)
      .then(r=>r.json()).catch(()=>({ results:[], count:0 }))
    setResults(data); setLoading(false)
  }

  const applyPreset = (pq, i) => {
    setActivePreset(i)
    setForm({ pin_code:'', status:'', source_system:'', no_inspection_months:'', ...pq.params })
    run(pq.params)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Cross-Department Query</h2>
        <p>Query across all 4 department systems simultaneously — enabled by the UBID linkage layer</p>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="section-title">Preset Queries</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {PRESET_QUERIES.map((pq, i) => (
            <button key={i} onClick={()=>applyPreset(pq,i)}
              className="btn btn-ghost"
              style={{ textAlign:'left', justifyContent:'flex-start',
                background: activePreset===i?'var(--accent-dim)':'',
                color: activePreset===i?'var(--accent)':'',
                borderColor: activePreset===i?'var(--accent)':'' }}>
              {pq.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div className="section-title">Custom Query Builder</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:16 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>PIN CODE</div>
            <select className="input" value={form.pin_code} onChange={e=>setForm(f=>({...f,pin_code:e.target.value}))}>
              <option value="">Any</option>
              <option value="560058">560058 — Peenya</option>
              <option value="560100">560100 — Electronic City</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>ACTIVITY STATUS</div>
            <select className="input" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              <option value="">Any</option>
              <option value="ACTIVE">Active</option>
              <option value="DORMANT">Dormant</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>DEPARTMENT SYSTEM</div>
            <select className="input" value={form.source_system} onChange={e=>setForm(f=>({...f,source_system:e.target.value}))}>
              <option value="">Any</option>
              <option value="FACTORIES">Factories Act</option>
              <option value="BBMP">BBMP Trade Licence</option>
              <option value="ESCOM">ESCOM Connection</option>
              <option value="LABOUR">Labour / PF</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>NO INSPECTION (months)</div>
            <input className="input" type="number" placeholder="e.g. 18"
              value={form.no_inspection_months}
              onChange={e=>setForm(f=>({...f,no_inspection_months:e.target.value}))} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={()=>run()} disabled={loading}>
          {loading ? 'Running...' : 'Run Query'}
        </button>
      </div>

      {loading && <div className="loading">Querying across departments...</div>}

      {!loading && ran && results && (
        <div>
          <div style={{ marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontWeight:700, fontSize:16 }}>
              {results.count} businesses match
              {form.no_inspection_months && ` — no inspection in last ${form.no_inspection_months} months`}
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>This query was impossible before UBID</div>
          </div>

          {results.count === 0 ? (
            <div className="card empty-state"><p>No businesses match these criteria</p></div>
          ) : (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <table className="data-table">
                <thead><tr>
                  <th>UBID</th><th>Business Name</th><th>Pin Code</th>
                  <th>Status</th><th>Conf.</th><th>Sources</th>
                  <th>Last Signal</th><th>Last Inspection</th>
                </tr></thead>
                <tbody>
                  {results.results.map(row => (
                    <tr key={row.ubid}>
                      <td className="primary" style={{ fontFamily:'monospace', fontSize:12 }}>{row.ubid}</td>
                      <td className="primary">{row.business_name}</td>
                      <td>{row.pin_code}</td>
                      <td><StatusBadge s={row.activity_status} /></td>
                      <td style={{ fontWeight:600, color:'var(--accent)' }}>{row.confidence_pct}%</td>
                      <td>{(row.sources||[]).map(s=>(
                        <span key={s} className="badge badge-system" style={{ fontSize:9, marginRight:2 }}>{s}</span>
                      ))}</td>
                      <td style={{ fontSize:12 }}>{row.last_signal_date||'—'}</td>
                      <td style={{ fontSize:12, color: row.last_inspection?'var(--text-secondary)':'var(--closed)' }}>
                        {row.last_inspection||'None on record'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
