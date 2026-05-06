import { useEffect, useState } from 'react'

const DECISION_COLORS = {
  AUTO_LINK:'var(--active)', ROUTED_TO_REVIEW:'var(--dormant)',
  CONFIRM:'var(--active)', REJECT:'var(--closed)', DEFER:'var(--blue)',
}

export default function AuditLog() {
  const [log, setLog]         = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')

  useEffect(() => {
    fetch('/api/audit-log?limit=300')
      .then(r => r.json())
      .then(d => { setLog(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter
    ? log.filter(r => r.decision?.includes(filter) || r.actor?.includes(filter))
    : log

  return (
    <div>
      <div className="page-header">
        <h2>Audit Log</h2>
        <p>Append-only log of every system and human decision. Every UBID linkage is fully traceable.</p>
      </div>

      <div className="card" style={{ marginBottom:20, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ fontSize:13, color:'var(--text-muted)', whiteSpace:'nowrap' }}>Filter:</div>
        {['AUTO_LINK','ROUTED_TO_REVIEW','CONFIRM','REJECT','DEFER'].map(d => (
          <button key={d} onClick={()=>setFilter(filter===d?'':d)} className="btn btn-ghost"
            style={{ fontSize:11, padding:'4px 10px',
              color: filter===d?(DECISION_COLORS[d]||'var(--accent)'):'',
              borderColor: filter===d?(DECISION_COLORS[d]||'var(--accent)'):'' }}>
            {d}
          </button>
        ))}
        <div style={{ marginLeft:'auto', fontSize:12, color:'var(--text-muted)' }}>{filtered.length} entries</div>
      </div>

      {loading && <div className="loading">Loading audit log...</div>}

      {!loading && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table className="data-table">
            <thead><tr>
              <th>Timestamp</th><th>Actor</th><th>Decision</th>
              <th>Pair / Record</th><th>Confidence</th><th>UBID</th><th>Notes</th>
            </tr></thead>
            <tbody>
              {filtered.slice().reverse().map((row,i) => (
                <tr key={i}>
                  <td style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                    {row.timestamp ? row.timestamp.replace('T',' ').split('.')[0] : '—'}
                  </td>
                  <td>
                    <span className={`badge ${row.actor==='SYSTEM'?'badge-system':'badge-pending'}`}>{row.actor}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight:700, fontSize:12, color:DECISION_COLORS[row.decision]||'var(--text-secondary)' }}>
                      {row.decision}
                    </span>
                  </td>
                  <td style={{ fontSize:11, fontFamily:'monospace', color:'var(--text-secondary)' }}>{row.pair_id||'—'}</td>
                  <td>
                    {row.confidence ? (
                      <span style={{ fontWeight:600, color: row.confidence>=85?'var(--active)':row.confidence>=55?'var(--dormant)':'var(--closed)' }}>
                        {row.confidence}%
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ fontFamily:'monospace', fontSize:11, color:'var(--accent)' }}>{row.ubid||'—'}</td>
                  <td style={{ fontSize:12, color:'var(--text-muted)' }}>{row.notes||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && <div className="empty-state" style={{ padding:40 }}><p>No entries match your filter</p></div>}
        </div>
      )}
    </div>
  )
}
