import { useState } from 'react'

function StatusBadge({ s }) {
  const cls = { ACTIVE: 'badge-active', DORMANT: 'badge-dormant', CLOSED: 'badge-closed', UNKNOWN: 'badge-system' }
  const icons = { ACTIVE: '●', DORMANT: '◐', CLOSED: '○' }
  return <span className={`badge ${cls[s] || 'badge-system'}`}>{icons[s]} {s}</span>
}

function EvidenceItem({ ev }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 14px', borderRadius: 8,
      background: 'var(--bg-card2)', border: '1px solid var(--border)',
      marginBottom: 6, fontSize: 12
    }}>
      <div>
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{ev.event}</span>
        <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>via {ev.source}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, color: 'var(--text-secondary)', alignItems: 'center' }}>
        <span>{ev.date}</span>
        <span style={{ color: 'var(--text-muted)' }}>{ev.days_ago}d ago</span>
        <span style={{ fontWeight: 700, color: 'var(--active)' }}>wt {ev.decayed_weight}</span>
      </div>
    </div>
  )
}

export default function UBIDLookup() {
  const [query, setQuery] = useState('')
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

  const EXAMPLES = ['BBMP/560058/0001', 'UBID-KA-000001', 'Shree Textiles']

  return (
    <div>
      <div className="page-header">
        <div className="page-header-badge">⌖ Business Registry</div>
        <h2>UBID Lookup</h2>
        <p>Search by source record ID, UBID, PAN, GSTIN, or business name fragment</p>
      </div>

      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 16 }}>⌖</span>
            <input
              className="input"
              style={{ paddingLeft: 40 }}
              placeholder="e.g. BBMP/560058/0042  ·  UBID-KA-000042  ·  Shree Textiles"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
            />
          </div>
          <button className="btn btn-primary" onClick={search} style={{ whiteSpace: 'nowrap', minWidth: 100 }}>
            {loading ? 'Searching...' : '⌖ Search'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Try:</span>
          {EXAMPLES.map(ex => (
            <button key={ex} className="btn btn-ghost btn-sm" onClick={() => { setQuery(ex); }}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="loading">Searching across all departments...</div>}

      {!loading && searched && results?.length === 0 && (
        <div className="card empty-state">
          <div className="empty-icon">🔍</div>
          <p>No UBID found for <strong>"{query}"</strong></p>
          <p style={{ fontSize: 12, marginTop: 8 }}>Try a different search term or check spelling</p>
        </div>
      )}

      {results?.map(card => (
        <div key={card.ubid} className="card" style={{ marginBottom: 24 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Unified Business Identifier</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', letterSpacing: -1, fontFamily: 'Space Grotesk, sans-serif' }}>{card.ubid}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                {card.record_count} linked record{card.record_count !== 1 ? 's' : ''} · last signal {card.last_signal_date || 'unknown'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <StatusBadge s={card.activity_status} />
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: card.confidence_pct >= 70 ? 'var(--active)' : 'var(--dormant)' }}>{card.confidence_pct}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>confidence</div>
              </div>
            </div>
          </div>

          <div className="section-title">Linked Source Records ({card.record_count})</div>
          <table className="data-table" style={{ marginBottom: 24 }}>
            <thead><tr>
              <th>Source</th><th>Record ID</th><th>Business Name</th>
              <th>PAN</th><th>GSTIN</th><th>Pin Code</th>
            </tr></thead>
            <tbody>
              {card.linked_records.map(r => (
                <tr key={r.source_record_id}>
                  <td><span className="badge badge-system">{r.source_system}</span></td>
                  <td className="primary" style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.source_record_id}</td>
                  <td className="primary">{r.business_name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.pan || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.gstin || '—'}</td>
                  <td>{r.pin_code}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {card.evidence?.length > 0 && (
            <>
              <div className="section-title">Activity Evidence ({card.evidence.length} signals)</div>
              {card.evidence.map((ev, i) => <EvidenceItem key={i} ev={ev} />)}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
