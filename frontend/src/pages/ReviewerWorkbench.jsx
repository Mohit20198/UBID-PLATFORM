import { useEffect, useState } from 'react'

function StatusBadge({ s }) {
  const cls = { ACTIVE:'badge-active', DORMANT:'badge-dormant', CLOSED:'badge-closed', UNKNOWN:'badge-system' }
  return <span className={`badge ${cls[s]||'badge-system'}`}>{s}</span>
}

function ConfBar({ pct }) {
  const color = pct >= 80 ? 'var(--active)' : pct >= 55 ? 'var(--dormant)' : 'var(--closed)'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ fontWeight:700, fontSize:16, color, minWidth:42 }}>{pct}%</span>
      <div className="conf-bar-wrap" style={{ flex:1 }}>
        <div className="conf-bar-fill" style={{ width:`${pct}%`, background:color }} />
      </div>
    </div>
  )
}

function FeatureRow({ label, value }) {
  const color = value > 0 ? 'var(--active)' : value < 0 ? 'var(--closed)' : 'var(--text-muted)'
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0',
      borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13 }}>
      <span style={{ color:'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight:700, color }}>{value > 0 ? '+' : ''}{value} pts</span>
    </div>
  )
}

export default function ReviewerWorkbench() {
  const [queue, setQueue]     = useState([])
  const [idx, setIdx]         = useState(0)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter]   = useState('PENDING')
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
    setAiExplain(res)
    setAiLoading(false)
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
        <h2>Reviewer Workbench</h2>
        <p>Review ambiguous entity matches (confidence 55–84%). Every decision is logged and improves the model.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:20 }}>
        {/* Queue list */}
        <div>
          <div style={{ display:'flex', gap:6, marginBottom:10 }}>
            {['PENDING','CONFIRM','REJECT'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className="btn btn-ghost"
                style={{ fontSize:11, padding:'4px 10px',
                  background: filter===s ? 'var(--accent-dim)' : '',
                  color: filter===s ? 'var(--accent)' : '' }}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:640, overflowY:'auto' }}>
            {queue.map((p, i) => (
              <div key={p.pair_id} onClick={() => { setIdx(i); setNotes(''); setAiExplain(null) }}
                style={{ padding:'10px 12px', borderRadius:8, cursor:'pointer',
                  background: i===idx ? 'var(--accent-dim)' : 'var(--bg-card)',
                  border:`1px solid ${i===idx ? 'var(--accent)' : 'var(--border)'}`,
                  transition:'all 0.15s' }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>{p.pair_id}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:4,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {p.unique_id_l}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>{p.confidence_pct}%</span>
                  <span className={`badge ${p.status==='PENDING'?'badge-pending':p.status==='CONFIRM'?'badge-confirm':'badge-reject'}`}
                    style={{ fontSize:9 }}>{p.status}</span>
                </div>
              </div>
            ))}
            {queue.length === 0 && <div className="empty-state" style={{ padding:20 }}><p>No items: {filter}</p></div>}
          </div>
        </div>

        {/* Detail view */}
        <div>
          {!pair ? (
            <div className="card empty-state"><p>Select a pair to review</p></div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Confidence + AI Explain button */}
              <div className="card" style={{ padding:'16px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ flex:1, marginRight:16 }}>
                    <div className="section-title" style={{ marginBottom:6 }}>Match Confidence</div>
                    <ConfBar pct={pair.confidence_pct} />
                  </div>
                  <div style={{ textAlign:'right', fontSize:12, color:'var(--text-muted)' }}>
                    <div style={{ marginBottom:6 }}>{pair.pair_id}</div>
                    <button className="btn btn-primary" style={{ fontSize:11 }}
                      onClick={runAiExplain} disabled={aiLoading}>
                      {aiLoading ? 'Analyzing...' : 'AI Analysis (Ollama)'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Ollama AI explanation */}
              {aiExplain && (
                <div className="ai-box">
                  <div className="ai-label">AI Audit Summary — model: {aiExplain.model}</div>
                  {aiExplain.explanation}
                </div>
              )}

              {/* Side-by-side */}
              <div className="two-col">
                {[
                  { label:'Record A', sid: pair.unique_id_l, src: pair.source_system_l, pan: pair.pan_l, gstin: pair.gstin_l, addr: pair.address_l, pin: pair.pin_code_l },
                  { label:'Record B', sid: pair.unique_id_r, src: pair.source_system_r, pan: pair.pan_r, gstin: pair.gstin_r, addr: pair.address_r, pin: pair.pin_code_r },
                ].map(({ label, sid, src, pan, gstin, addr, pin }, ri) => {
                  const otherPan   = ri===0 ? pair.pan_r   : pair.pan_l
                  const otherGstin = ri===0 ? pair.gstin_r : pair.gstin_l
                  const otherPin   = ri===0 ? pair.pin_code_r : pair.pin_code_l
                  return (
                    <div key={label} className="card" style={{ padding:'16px 20px' }}>
                      <div className="section-title">{label}</div>
                      {[
                        ['Source', src || '—'],
                        ['Record ID', sid],
                        ['PAN', pan || '—'],
                        ['GSTIN', gstin || '—'],
                        ['Address', addr || '—'],
                        ['Pin Code', pin],
                      ].map(([k, v]) => {
                        const matches = (k==='PAN' && pan && pan===otherPan)
                          || (k==='GSTIN' && gstin && gstin===otherGstin)
                          || (k==='Pin Code' && pin===otherPin)
                        return (
                          <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0',
                            borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:13 }}>
                            <span style={{ color:'var(--text-muted)', minWidth:70 }}>{k}</span>
                            <span style={{ fontWeight:500, color: matches?'var(--active)':'var(--text-primary)',
                              maxWidth:180, textAlign:'right', wordBreak:'break-word', fontFamily: k!=='Address'?'monospace':'inherit', fontSize:12 }}>{v}</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Feature contributions */}
              <div className="card" style={{ padding:'16px 20px' }}>
                <div className="section-title">Evidence Breakdown</div>
                {pair.feature_contributions && Object.entries(pair.feature_contributions).map(([k, v]) => (
                  <FeatureRow key={k} label={k.replace(/_/g,' ').replace(/\b\w/g, l=>l.toUpperCase())} value={v} />
                ))}
              </div>

              {/* Decision */}
              {pair.status === 'PENDING' ? (
                <div className="card" style={{ padding:'16px 20px' }}>
                  <div className="section-title">Your Decision</div>
                  <textarea className="input" style={{ marginBottom:12, resize:'vertical', minHeight:60 }}
                    placeholder="Notes (required for Reject)" value={notes} onChange={e=>setNotes(e.target.value)} />
                  <div style={{ display:'flex', gap:10 }}>
                    <button className="btn btn-success" onClick={()=>decide('CONFIRM')} disabled={submitting} style={{ flex:1 }}>Confirm Match</button>
                    <button className="btn btn-danger"  onClick={()=>decide('REJECT')}  disabled={submitting} style={{ flex:1 }}>Reject</button>
                    <button className="btn btn-ghost"   onClick={()=>decide('DEFER')}   disabled={submitting} style={{ flex:1 }}>Defer</button>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ textAlign:'center', padding:20 }}>
                  <span className={`badge ${pair.status==='CONFIRM'?'badge-confirm':'badge-reject'}`}
                    style={{ fontSize:14, padding:'6px 16px' }}>Decision: {pair.status}</span>
                  {pair.reviewer_notes && <div style={{ marginTop:8, color:'var(--text-secondary)', fontSize:13 }}>{pair.reviewer_notes}</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
