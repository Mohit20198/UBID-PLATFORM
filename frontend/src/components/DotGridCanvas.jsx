import { useEffect, useRef } from 'react'

const SPACING   = 28       // px between dots
const DOT_R     = 1.6      // base radius of each dot
const REPEL_R   = 110      // radius of mouse influence
const SPRING    = 0.08     // spring constant (return force)
const FRICTION  = 0.82     // velocity damping per frame
const PUSH      = 6        // repulsion strength multiplier
const DOT_ALPHA = 0.28     // base opacity of dots

export default function DotGridCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let raf
    let dots = []
    let mouse = { x: -9999, y: -9999 }

    // ── build grid ──────────────────────────────────────────────────────────
    function buildGrid() {
      const cols = Math.ceil(canvas.width  / SPACING) + 1
      const rows = Math.ceil(canvas.height / SPACING) + 1
      // Centre the grid
      const offX = (canvas.width  - (cols - 1) * SPACING) / 2
      const offY = (canvas.height - (rows - 1) * SPACING) / 2
      dots = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ox = offX + c * SPACING
          const oy = offY + r * SPACING
          dots.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0 })
        }
      }
    }

    // ── resize ──────────────────────────────────────────────────────────────
    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      buildGrid()
    }

    // ── animation loop ───────────────────────────────────────────────────────
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const d of dots) {
        // distance from mouse
        const dx  = d.x - mouse.x
        const dy  = d.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // repulsion force (inverse-square-ish, clamped to radius)
        if (dist < REPEL_R && dist > 0) {
          const force  = (1 - dist / REPEL_R) * PUSH
          const angle  = Math.atan2(dy, dx)
          d.vx += Math.cos(angle) * force
          d.vy += Math.sin(angle) * force
        }

        // spring back to origin
        d.vx += (d.ox - d.x) * SPRING
        d.vy += (d.oy - d.y) * SPRING

        // friction / damping
        d.vx *= FRICTION
        d.vy *= FRICTION

        d.x += d.vx
        d.y += d.vy

        // proximity brightness – dots closer to cursor glow a little
        const distFromOrigin = Math.hypot(d.x - d.ox, d.y - d.oy)
        const displaceFactor = Math.min(distFromOrigin / 30, 1)
        const alpha = DOT_ALPHA + displaceFactor * 0.18

        ctx.beginPath()
        ctx.arc(d.x, d.y, DOT_R, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 153, 51, ${alpha})`
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    // ── event listeners ──────────────────────────────────────────────────────
    function onMouseMove(e) {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    function onMouseLeave() {
      mouse.x = -9999
      mouse.y = -9999
    }

    resize()
    window.addEventListener('resize',     resize)
    window.addEventListener('mousemove',  onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize',     resize)
      window.removeEventListener('mousemove',  onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:  'fixed',
        top:        0,
        left:       0,
        width:     '100vw',
        height:    '100vh',
        zIndex:    -1,
        pointerEvents: 'none',
        display:   'block',
      }}
    />
  )
}
