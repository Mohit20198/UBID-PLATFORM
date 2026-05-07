import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './AboutPage.css'

const PROBLEM_PARTS = [
  {
    id: 'A',
    color: '#FF9933',
    title: 'Part A — Give every business a Unique Business Identifier (UBID)',
    points: [
      'Automatically link records that refer to the same real-world business across 3–4 State department systems.',
      'Where PAN or GSTIN is present, anchor the UBID to that Central identifier.',
      'Every linkage decision must carry an explainable confidence signal.',
      'High-confidence matches committed automatically. Ambiguous matches routed to human reviewer.',
      'Reviewer decisions captured to improve linking over time.',
    ],
  },
  {
    id: 'B',
    color: '#4A90E2',
    title: 'Part B — Tell whether each business is actually active',
    points: [
      'Infer for each UBID whether the business is currently Active, Dormant or Closed.',
      'Every classification must be explainable — which signals drove the verdict and over what time window.',
      'Events that cannot be confidently joined to a UBID must be surfaced for review, not silently dropped.',
      'Activity data from inspections, renewals, compliance filings, and consumption signals.',
    ],
  },
]

const TECH_STACK = [
  { layer: 'Data Sources', items: ['BBMP Trade Licences', 'ESCOM Electricity', 'Labour / PF', 'Factories Act'], color: '#6366f1' },
  { layer: 'AI Pipeline', items: ['Pandas Normalisation', 'Splink v3 Entity Resolution', 'Fellegi-Sunter Model', 'Decay-weighted Scoring'], color: '#FF9933' },
  { layer: 'Backend API', items: ['FastAPI + Uvicorn', 'Python 3.13', 'Reviewer Decision Engine', 'Ollama / Phi-3 (Local LLM)'], color: '#22c55e' },
  { layer: 'Frontend', items: ['React + Vite', 'Recharts Analytics', 'Reviewer Workbench', 'Cross-Dept Query UI'], color: '#4A90E2' },
]

const NON_NEGOTIABLES = [
  { icon: 'NN', text: 'Source department systems cannot be modified, re-platformed or migrated.' },
  { icon: 'NN', text: 'Real business data will not be released. All implementation runs on deterministically scrambled or synthetic data.' },
  { icon: 'NN', text: 'Every automated decision must be explainable and reversible. A wrong merge is more costly than a missed one.' },
  { icon: 'NN', text: 'Hosted-LLM calls on raw PII are not permitted. Any LLM usage must work on scrambled or synthetic inputs only.' },
]

const SUCCESS_METRICS = [
  { metric: 'Unified Lookup', desc: 'A lookup by any department record ID, PAN/GSTIN, or name + pin code returns a single UBID with supporting evidence.' },
  { metric: 'Live Status', desc: 'Each UBID carries a current Active, Dormant or Closed status with the events that justify it.' },
  { metric: 'Smart Review', desc: 'Ambiguous matches surface in a reviewer workflow rather than being silently committed.' },
  { metric: 'Cross-Dept Queries', desc: '"Active factories in 560058 with no inspection in 18 months" — queries impossible before UBID.' },
]

function AnimatedSection({ children, delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { e.target.classList.add('about-visible'); observer.disconnect() } },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className="about-anim" style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="about-page">

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-bg">
          <div className="about-orb a1" />
          <div className="about-orb a2" />
          <div className="about-grid" />
        </div>
        <div className="about-hero-content">
          <div className="about-eyebrow">Theme 1 — Karnataka Commerce &amp; Industry</div>
          <h1 className="about-title">
            The Problem with<br />
            <span className="about-gradient">Siloed Government Data</span>
          </h1>
          <p className="about-subtitle">
            Karnataka operates 40+ department systems — each built in isolation, with its own schema,
            its own identifiers, its own validation rules. The same business exists as different records
            in different databases and cannot be linked.
          </p>
          <div className="about-hero-actions">
            <Link to="/dashboard" className="btn-hero-primary">Open Dashboard</Link>
            <Link to="/" className="btn-hero-ghost">Back to Home</Link>
          </div>
        </div>
      </section>

      {/* Context */}
      <section className="about-section">
        <div className="about-inner">
          <AnimatedSection>
            <div className="about-section-label">The Context</div>
            <h2 className="about-section-title">Karnataka's Data Fragmentation Problem</h2>
            <div className="about-context-grid">
              <div className="about-context-card">
                <div className="about-context-num" style={{ color: '#FF9933' }}>40+</div>
                <div className="about-context-label">State Department Systems</div>
                <p className="about-context-desc">Each built in isolation. Shop Establishment, Factories, Labour, KSPCB, BESCOM, BWSSB, Fire, Food Safety, and more.</p>
              </div>
              <div className="about-context-card">
                <div className="about-context-num" style={{ color: '#4A90E2' }}>0</div>
                <div className="about-context-label">Reliable Join Keys</div>
                <p className="about-context-desc">Business name and address stored as free text with no cross-system normalisation. PAN and GSTIN only partially captured.</p>
              </div>
              <div className="about-context-card">
                <div className="about-context-num" style={{ color: '#22c55e' }}>0</div>
                <div className="about-context-label">Cross-System Queries</div>
                <p className="about-context-desc">Karnataka Commerce cannot answer: how many businesses are operating, in what sectors, where, and with what recent activity.</p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <blockquote className="about-quote">
              "Activity data — inspections, renewals, consumption, compliance events — sits inside each
              department system and cannot be aggregated per business."
              <cite>— Problem Statement, AI for Bharat 2026</cite>
            </blockquote>
          </AnimatedSection>
        </div>
      </section>

      {/* Problem Parts */}
      <section className="about-section about-dark">
        <div className="about-inner">
          <AnimatedSection>
            <div className="about-section-label">The Problem</div>
            <h2 className="about-section-title">Two Parts. One Solution.</h2>
            <p className="about-section-desc">
              The second part is only solvable after the first — which is why they form a single problem statement.
            </p>
          </AnimatedSection>
          <div className="about-parts-grid">
            {PROBLEM_PARTS.map((part, i) => (
              <AnimatedSection key={part.id} delay={i * 150}>
                <div className="about-part-card" style={{ '--pc': part.color }}>
                  <div className="about-part-id" style={{ color: part.color }}>Part {part.id}</div>
                  <h3 className="about-part-title">{part.title}</h3>
                  <ul className="about-part-list">
                    {part.points.map((p, j) => (
                      <li key={j}>
                        <span className="about-part-bullet" style={{ background: part.color }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Our Solution — Tech Architecture */}
      <section className="about-section">
        <div className="about-inner">
          <AnimatedSection>
            <div className="about-section-label">Our Solution</div>
            <h2 className="about-section-title">UBID Platform Architecture</h2>
            <p className="about-section-desc">
              A four-layer stack that sits alongside existing systems without modifying them.
              All data stays on-premise. All decisions are explainable and reversible.
            </p>
          </AnimatedSection>

          {/* Architecture Flow */}
          <div className="about-arch">
            {TECH_STACK.map((layer, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="about-arch-layer" style={{ '--lc': layer.color }}>
                  <div className="about-arch-layer-header">
                    <div className="about-arch-layer-num">{String(i + 1).padStart(2, '0')}</div>
                    <div className="about-arch-layer-name">{layer.layer}</div>
                  </div>
                  <div className="about-arch-items">
                    {layer.items.map((item, j) => (
                      <div key={j} className="about-arch-item">{item}</div>
                    ))}
                  </div>
                  {i < TECH_STACK.length - 1 && <div className="about-arch-arrow">↓</div>}
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Pipeline detail */}
          <AnimatedSection delay={200}>
            <div className="about-pipeline">
              <div className="about-section-label" style={{ marginBottom: 24 }}>AI Pipeline Detail</div>
              <div className="about-pipeline-steps">
                {[
                  { step: '01', title: 'Ingest', desc: 'Raw records pulled from 4 department systems. Variable completeness. No shared schema.' },
                  { step: '02', title: 'Normalise', desc: 'Business names, addresses, pin codes cleaned and standardised. Identifiers (PAN, GSTIN) extracted.' },
                  { step: '03', title: 'Block & Compare', desc: 'Splink blocking reduces candidate pairs. Fellegi-Sunter weights compute match probability.' },
                  { step: '04', title: 'Decide', desc: 'High confidence (≥85%): auto-linked. Medium (55–84%): routed to reviewer. Low: kept separate.' },
                  { step: '05', title: 'Classify', desc: 'Time-decayed activity signals infer Active, Dormant, or Closed status per UBID.' },
                ].map((s, i) => (
                  <div key={i} className="about-pipeline-step">
                    <div className="about-pipeline-num">{s.step}</div>
                    <div className="about-pipeline-content">
                      <div className="about-pipeline-title">{s.title}</div>
                      <div className="about-pipeline-desc">{s.desc}</div>
                    </div>
                    {i < 4 && <div className="about-pipeline-connector" />}
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Non-Negotiables */}
      <section className="about-section about-dark">
        <div className="about-inner">
          <AnimatedSection>
            <div className="about-section-label">Design Constraints</div>
            <h2 className="about-section-title">Non-Negotiables</h2>
          </AnimatedSection>
          <div className="about-nn-grid">
            {NON_NEGOTIABLES.map((nn, i) => (
              <AnimatedSection key={i} delay={i * 80}>
                <div className="about-nn-card">
                  <div className="about-nn-bar" />
                  <p>{nn.text}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="about-section">
        <div className="about-inner">
          <AnimatedSection>
            <div className="about-section-label">What Success Looks Like</div>
            <h2 className="about-section-title">Four Capabilities Unlocked</h2>
          </AnimatedSection>
          <div className="about-success-grid">
            {SUCCESS_METRICS.map((s, i) => (
              <AnimatedSection key={i} delay={i * 100}>
                <div className="about-success-card">
                  <div className="about-success-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="about-success-metric">{s.metric}</div>
                  <p className="about-success-desc">{s.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Scenario */}
      <section className="about-section about-dark">
        <div className="about-inner">
          <AnimatedSection>
            <div className="about-section-label">Sample Scenario</div>
            <h2 className="about-section-title">What a Working Solution Delivers</h2>
            <div className="about-scenario">
              <p className="about-scenario-text">
                Master data for <strong>2 pin codes in Bengaluru Urban</strong>, across
                <strong> 4 department systems</strong> (Shop Establishment, Factories, Labour, KSPCB),
                plus a one-way stream of transaction and activity events over the preceding
                <strong> 12 months</strong>.
              </p>
              <div className="about-scenario-outcomes">
                <div className="about-scenario-outcome">
                  <div className="about-outcome-dot" style={{ background: '#22c55e' }} />
                  Fewer UBIDs than input rows — records successfully merged
                </div>
                <div className="about-scenario-outcome">
                  <div className="about-outcome-dot" style={{ background: '#FF9933' }} />
                  High-confidence cases auto-linked; ambiguous sent to reviewer
                </div>
                <div className="about-scenario-outcome">
                  <div className="about-outcome-dot" style={{ background: '#4A90E2' }} />
                  UBIDs anchored to PAN or GSTIN wherever present
                </div>
                <div className="about-scenario-outcome">
                  <div className="about-outcome-dot" style={{ background: '#a855f7' }} />
                  Each business classified Active, Dormant or Closed with evidence timeline
                </div>
                <div className="about-scenario-outcome">
                  <div className="about-outcome-dot" style={{ background: '#f59e0b' }} />
                  "Active factories without recent inspection" query returns real answers
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="about-section about-cta">
        <div className="about-inner" style={{ textAlign: 'center' }}>
          <AnimatedSection>
            <h2 className="about-section-title">Explore the Live Platform</h2>
            <p className="about-section-desc" style={{ margin: '0 auto 36px', maxWidth: 500 }}>
              878 real synthetic businesses. 1,876 linked records. Fully running locally with FastAPI + React + Splink.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/dashboard" className="btn-hero-primary">Open Dashboard</Link>
              <Link to="/review" className="btn-hero-ghost">Reviewer Workbench</Link>
              <Link to="/query" className="btn-hero-ghost">Cross-Dept Query</Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}
