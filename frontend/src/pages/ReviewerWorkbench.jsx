import { useEffect, useState } from 'react'

function ConfBar({ pct }) {
  const color = pct >= 80 ? 'var(--active)' : pct >= 55 ? 'var(--dormant)' : 'var(--closed)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontWeight: 800, fontSize: 22, color, minWidth: 50, fontFamily: 'Space Grotesk, sans-serif' }}>{pct}%</span>
      <div style={{ flex: 1 }}>
        <div className="conf-bar-wrap" style={{ height: 8 }}>
          <div className="conf-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          {pct >= 80 ? 'High confidence — likely same entity' : pct >= 65 ? 'Medium confidence — review carefully' : 'Low confidence — likely different entities'}
        </div>
      </div>
    </div>
  )
}

function FeatureRow({ label, value }) {
  const color = value > 0 ? 'var(--active)' : value < 0 ? 'var(--closed)' : 'var(--text-muted)'
  const pct = Math.min(Math.abs(value) * 20, 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: 12, minWidth: 160 }}>{label}</span>
      <div style={{ flex: 1 }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.5s ease' }} />
        </div>
      </div>
      <span style={{ fontWeight: 700, fontSize: 12, color, minWidth: 60, textAlign: 'right' }}>
        {value > 0 ? '+' : ''}{value} pts
      </span>
    </div>
  )
}

function QueueItem({ pair, isActive, onClick }) {
  const statusCls = { PENDING: 'badge-pending', CONFIRM: 'badge-confirm', REJECT: 'badge-reject', DEFER: 'badge-system' }
  return (
    <div onClick={onClick} style={{
      padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
      background: isActive ? 'rgba(255,153,51,0.08)' : 'var(--bg-card)',
      border: `1px solid ${isActive ? 'rgba(255,153,51,0.4)' : 'var(--border)'}`,
      transition: 'all 0.15s', marginBottom: 6
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, fontFamily: 'monospace' }}>{pair.pair_id}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {pair.unique_id_l}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 24, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pair.confidence_pct}%`, background: pair.confidence_pct >= 80 ? 'var(--active)' : 'var(--dormant)', borderRadius: 999 }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pair.confidence_pct}%</span>
        </div>
        <span className={`badge ${statusCls[pair.status] || 'badge-system'}`} style={{ fontSize: 10 }}>{pair.status}</span>
      </div>
    </div>
  )
}

export default function ReviewerWorkbench() {
  const [queue, setQueue] = useState([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('PENDING')
  const [aiExplain, setAiExplain] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const load = () => {
    setLoading(true); setAiExplain(null)
    fetch(`/api/review-queue?status=${filter}&limit=50`)
      .then(r => r.json())
      .then(d => { setQueue(d); setIdx(0); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const pair = queue[idx]

  const runAiExplain = async () => {
    if (!pair) return
    setAiLoading(true); setAiExplain(null)
    const res = await fetch('/api/ai-explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pair_id: pair.pair_id }),
    }).then(r => r.json()).catch(() => null)
    setAiExplain(res); setAiLoading(false)
  }

  const decide = async (decision) => {
    if (!pair) return
    if (decision === 'REJECT' && !notes.trim()) { alert('Notes required for Reject.'); return }
    setSubmitting(true)
    await fetch(`/api/review-queue/${pair.pair_id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes }),
    })
    setSubmitting(false); setNotes(''); setAiExplain(null)
    const updated = queue.map(p => p.pair_id === pair.pair_id ? { ...p, status: decision } : p)
    setQueue(updated)
    if (idx < queue.length - 1) setIdx(i => i + 1)
  }

  if (loading) return <div className="loading">Loading review queue...</div>

  return (
    <div>
      <div className="page-header">
        <div className="page-header-badge">⚑ Human-in-the-Loop</div>
        <h2>Reviewer Workbench</h2>
        <p>Review ambiguous entity matches (confidence 55–84%). Every decision is logged and improves the AI model.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Queue Panel */}
        <div>
          <div className="filter-tabs" style={{ marginBottom: 12 }}>
            {['PENDING', 'CONFIRM', 'REJECT'].map(s => (
              <button key={s} className={`filter-tab${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
                {s === 'PENDING' ? '⏳' : s === 'CONFIRM' ? '✓' : '✕'} {s}
              </button>
            ))}
          </div>
          <div style={{ maxHeight: 680, overflowY: 'auto', paddingRight: 4 }}>
            {queue.map((p, i) => (
              <QueueItem key={p.pair_id} pair={p} isActive={i === idx}
                onClick={() => { setIdx(i); setNotes(''); setAiExplain(null) }} />
            ))}
            {queue.length === 0 && (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-icon">✓</div>
                <p>No {filter.toLowerCase()} items</p>
              </div>
            )}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            {queue.length} item{queue.length !== 1 ? 's' : ''} · {idx + 1} of {queue.length}
          </div>
        </div>

        {/* Detail Panel */}
        <div>
          {!pair ? (
            <div className="card empty-state" style={{ padding: 60 }}>
              <div className="empty-icon">⚑</div>
              <p>Select a pair from the queue to review</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Confidence Card */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div className="section-title" style={{ marginBottom: 10 }}>Match Confidence</div>
                    <ConfBar pct={pair.confidence_pct} />
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'monospace' }}>{pair.pair_id}</div>
                    <button className="btn btn-primary btn-sm" onClick={runAiExplain} disabled={aiLoading}>
                      {aiLoading ? '⏳ Analyzing...' : '🧠 AI Analysis'}
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Explanation */}
              {aiExplain && (
                <div className="ai-box">
                  <div className="ai-label">🧠 AI Audit Summary — model: {aiExplain.model}</div>
                  {aiExplain.explanation}
                </div>
              )}

              {/* Side-by-side records */}
              <div className="two-col">
                {[
                  { label: 'Record A', sid: pair.unique_id_l, src: pair.source_system_l, pan: pair.pan_l, gstin: pair.gstin_l, addr: pair.address_l, pin: pair.pin_code_l },
                  { label: 'Record B', sid: pair.unique_id_r, src: pair.source_system_r, pan: pair.pan_r, gstin: pair.gstin_r, addr: pair.address_r, pin: pair.pin_code_r },
                ].map(({ label, sid, src, pan, gstin, addr, pin }, ri) => {
                  const otherPan   = ri === 0 ? pair.pan_r   : pair.pan_l
                  const otherGstin = ri === 0 ? pair.gstin_r : pair.gstin_l
                  const otherPin   = ri === 0 ? pair.pin_code_r : pair.pin_code_l
                  return (
                    <div key={label} className="card" style={{ borderColor: ri === 0 ? 'rgba(74,144,226,0.2)' : 'rgba(168,85,247,0.2)' }}>
                      <div className="section-title" style={{ color: ri === 0 ? 'var(--blue)' : '#a855f7' }}>{label}</div>
                      {[
                        ['Source', src || '—'],
                        ['Record ID', sid],
                        ['PAN', pan || '—'],
                        ['GSTIN', gstin || '—'],
                        ['Address', addr || '—'],
                        ['Pin Code', pin],
                      ].map(([k, v]) => {
                        const matches = (k === 'PAN' && pan && pan === otherPan)
                          || (k === 'GSTIN' && gstin && gstin === otherGstin)
                          || (k === 'Pin Code' && pin === otherPin)
                        return (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}>
                            <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>{k}</span>
                            <span style={{
                              fontWeight: matches ? 700 : 500,
                              color: matches ? 'var(--active)' : 'var(--text-primary)',
                              maxWidth: 180, textAlign: 'right', wordBreak: 'break-word',
                              fontFamily: k !== 'Address' && k !== 'Source' ? 'monospace' : 'inherit',
                              fontSize: 12,
                              background: matches ? 'rgba(34,197,94,0.08)' : 'transparent',
                              padding: matches ? '1px 6px' : '0',
                              borderRadius: matches ? 4 : 0,
                            }}>{v}</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Evidence Breakdown */}
              <div className="card">
                <div className="section-title">Evidence Breakdown</div>
                {pair.feature_contributions && Object.entries(pair.feature_contributions).map(([k, v]) => (
                  <FeatureRow key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} value={v} />
                ))}
              </div>

              {/* Decision */}
              {pair.status === 'PENDING' ? (
                <div className="card">
                  <div className="section-title">Your Decision</div>
                  <textarea className="input" style={{ marginBottom: 14, resize: 'vertical', minHeight: 70, fontFamily: 'inherit' }}
                    placeholder="Reviewer notes (required for Reject)" value={notes} onChange={e => setNotes(e.target.value)} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <button className="btn btn-success" onClick={() => decide('CONFIRM')} disabled={submitting} style={{ justifyContent: 'center' }}>✓ Confirm Match</button>
                    <button className="btn btn-danger"  onClick={() => decide('REJECT')}  disabled={submitting} style={{ justifyContent: 'center' }}>✕ Reject</button>
                    <button className="btn btn-ghost"   onClick={() => decide('DEFER')}   disabled={submitting} style={{ justifyContent: 'center' }}>⏸ Defer</button>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: 28 }}>
                  <span className={`badge ${pair.status === 'CONFIRM' ? 'badge-confirm' : pair.status === 'REJECT' ? 'badge-reject' : 'badge-system'}`}
                    style={{ fontSize: 14, padding: '8px 20px' }}>
                    {pair.status === 'CONFIRM' ? '✓ CONFIRMED' : pair.status === 'REJECT' ? '✕ REJECTED' : '⏸ DEFERRED'}
                  </span>
                  {pair.reviewer_notes && <div style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 13 }}>{pair.reviewer_notes}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
