import { useEffect, useState } from 'react'

const DECISION_COLORS = {
  AUTO_LINK: 'var(--active)', ROUTED_TO_REVIEW: 'var(--dormant)',
  CONFIRM: 'var(--active)', REJECT: 'var(--closed)', DEFER: 'var(--blue)',
}
const DECISION_BG = {
  AUTO_LINK: 'var(--active-dim)', ROUTED_TO_REVIEW: 'var(--dormant-dim)',
  CONFIRM: 'var(--active-dim)', REJECT: 'var(--closed-dim)', DEFER: 'var(--blue-dim)',
}

export default function AuditLog() {
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('/api/audit-log?limit=300')
      .then(r => r.json())
      .then(d => { setLog(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter
    ? log.filter(r => r.decision?.includes(filter) || r.actor?.includes(filter))
    : log

  const FILTERS = ['AUTO_LINK', 'ROUTED_TO_REVIEW', 'CONFIRM', 'REJECT', 'DEFER']

  return (
    <div>
      <div className="page-header">
        <div className="page-header-badge">≡ Immutable Log</div>
        <h2>Audit Log</h2>
        <p>Append-only log of every system and human decision. Every UBID linkage is fully traceable.</p>
      </div>

      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Filter</div>
        <div className="filter-tabs">
          <button className={`filter-tab${filter === '' ? ' active' : ''}`} onClick={() => setFilter('')}>All</button>
          {FILTERS.map(d => (
            <button key={d} className={`filter-tab${filter === d ? ' active' : ''}`} onClick={() => setFilter(filter === d ? '' : d)}>
              {d.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
          {filtered.length.toLocaleString()} entries
        </div>
      </div>

      {loading && <div className="loading">Loading audit log...</div>}

      {!loading && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead><tr>
              <th>Timestamp</th><th>Actor</th><th>Decision</th>
              <th>Pair / Record</th><th>Confidence</th><th>UBID</th><th>Notes</th>
            </tr></thead>
            <tbody>
              {filtered.slice().reverse().map((row, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                    {row.timestamp ? row.timestamp.replace('T', ' ').split('.')[0] : '—'}
                  </td>
                  <td>
                    <span className={`badge ${row.actor === 'SYSTEM' ? 'badge-system' : 'badge-pending'}`}>
                      {row.actor === 'SYSTEM' ? '🤖 SYSTEM' : `👤 ${row.actor}`}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px', borderRadius: 999,
                      fontSize: 11, fontWeight: 700,
                      background: DECISION_BG[row.decision] || 'rgba(148,163,184,0.08)',
                      color: DECISION_COLORS[row.decision] || 'var(--text-secondary)',
                    }}>
                      {row.decision}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)', maxWidth: 180 }}>
                    {row.pair_id || '—'}
                  </td>
                  <td>
                    {row.confidence ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontWeight: 700, fontSize: 13,
                          color: row.confidence >= 85 ? 'var(--active)' : row.confidence >= 55 ? 'var(--dormant)' : 'var(--closed)'
                        }}>
                          {row.confidence}%
                        </span>
                        <div className="conf-bar-wrap" style={{ width: 40 }}>
                          <div className="conf-bar-fill" style={{
                            width: `${row.confidence}%`,
                            background: row.confidence >= 85 ? 'var(--active)' : row.confidence >= 55 ? 'var(--dormant)' : 'var(--closed)'
                          }} />
                        </div>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent)' }}>{row.ubid || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200 }}>{row.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty-state" style={{ padding: 48 }}><div className="empty-icon">🔍</div><p>No entries match your filter</p></div>}
        </div>
      )}
    </div>
  )
}
