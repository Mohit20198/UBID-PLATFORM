import { useState } from 'react'

function StatusBadge({ s }) {
  const cls = { ACTIVE:'badge-active', DORMANT:'badge-dormant', CLOSED:'badge-closed', UNKNOWN:'badge-system' }
  return <span className={`badge ${cls[s]||'badge-system'}`}>{s}</span>
}

function EvidenceItem({ ev }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0',
      borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12 }}>
      <div>
        <span style={{ fontWeight:600, color:'var(--accent)' }}>{ev.event}</span>
        <span style={{ color:'var(--text-muted)', marginLeft:8 }}>via {ev.source}</span>
      </div>
      <div style={{ color:'var(--text-secondary)' }}>{ev.date} ({ev.days_ago}d ago) — wt {ev.decayed_weight}</div>
    </div>
  )
}

export default function UBIDLookup() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true); setSearched(true)
    const data = await fetch(`/api/lookup?q=${encodeURIComponent(query.trim())}`)
      .then(r => r.json()).catch(() => [])
    setResults(data); setLoading(false)
  }

  return (
    <div>
      <div className="page-header">
        <h2>UBID Lookup</h2>
        <p>Search by source record ID, UBID, PAN, GSTIN, or business name fragment</p>
      </div>

      <div className="card" style={{ marginBottom:24 }}>
        <div style={{ display:'flex', gap:10 }}>
          <input className="input"
            placeholder="e.g. BBMP/560058/0042  or  UBID-KA-000042  or  ABCCP1234D  or  Shree Textiles"
            value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&search()} />
          <button className="btn btn-primary" onClick={search} style={{ whiteSpace:'nowrap' }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        <div style={{ marginTop:10, fontSize:12, color:'var(--text-muted)' }}>
          Try: <code style={{ color:'var(--accent)' }}>BBMP/560058/0001</code> &nbsp;|&nbsp;
          <code style={{ color:'var(--accent)' }}>UBID-KA-000001</code> &nbsp;|&nbsp;
          any business name fragment
        </div>
      </div>

      {loading && <div className="loading">Searching...</div>}

      {!loading && searched && results?.length === 0 && (
        <div className="card empty-state">
          <p>No UBID found for <strong>"{query}"</strong></p>
        </div>
      )}

      {results?.map(card => (
        <div key={card.ubid} className="card" style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>Unified Business Identifier</div>
              <div style={{ fontSize:24, fontWeight:800, color:'var(--accent)', letterSpacing:'-0.5px', fontFamily:'monospace' }}>{card.ubid}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <StatusBadge s={card.activity_status} />
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>{card.confidence_pct}% confidence</div>
              {card.last_signal_date && <div style={{ fontSize:11, color:'var(--text-muted)' }}>Last signal: {card.last_signal_date}</div>}
            </div>
          </div>

          <div className="section-title">Linked Source Records ({card.record_count})</div>
          <table className="data-table" style={{ marginBottom:20 }}>
            <thead><tr>
              <th>Source</th><th>Record ID</th><th>Business Name</th>
              <th>PAN</th><th>GSTIN</th><th>Pin Code</th>
            </tr></thead>
            <tbody>
              {card.linked_records.map(r => (
                <tr key={r.source_record_id}>
                  <td><span className="badge badge-system">{r.source_system}</span></td>
                  <td className="primary" style={{ fontFamily:'monospace', fontSize:12 }}>{r.source_record_id}</td>
                  <td className="primary">{r.business_name}</td>
                  <td style={{ fontFamily:'monospace' }}>{r.pan||'—'}</td>
                  <td style={{ fontFamily:'monospace', fontSize:11 }}>{r.gstin||'—'}</td>
                  <td>{r.pin_code}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {card.evidence?.length > 0 && (
            <>
              <div className="section-title">Activity Evidence</div>
              {card.evidence.map((ev,i) => <EvidenceItem key={i} ev={ev} />)}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
