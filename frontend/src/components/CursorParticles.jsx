import { useEffect, useRef, useState } from 'react'

export default function CursorParticles() {
  const canvasRef = useRef(null)
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const mouse = useRef({ x: -999, y: -999 })
  const ring = useRef({ x: -999, y: -999 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dot = dotRef.current
    const ringEl = ringRef.current
    let particles = []
    let animId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY

      // Move cursor dot instantly
      dot.style.left = e.clientX + 'px'
      dot.style.top = e.clientY + 'px'

      // Spawn particles
      for (let i = 0; i < 2; i++) {
        particles.push({
          x: e.clientX + (Math.random() - 0.5) * 6,
          y: e.clientY + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 1.0,
          vy: (Math.random() - 0.5) * 1.0 - 0.5,
          life: 1,
          decay: 0.03 + Math.random() * 0.02,
          size: 1.5 + Math.random() * 2.5,
          hue: 25 + Math.random() * 20,
        })
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Smooth ring follow
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12
      ringEl.style.left = ring.current.x + 'px'
      ringEl.style.top = ring.current.y + 'px'

      // Draw particles
      particles = particles.filter(p => p.life > 0)
      for (const p of particles) {
        ctx.save()
        ctx.globalAlpha = p.life * 0.55
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
        g.addColorStop(0, `hsla(${p.hue}, 100%, 68%, 1)`)
        g.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        p.x += p.vx
        p.y += p.vy
        p.vy -= 0.018
        p.size *= 0.965
        p.life -= p.decay
      }

      animId = requestAnimationFrame(draw)
    }

    window.addEventListener('mousemove', onMove)
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed', top: 0, left: 0,
          pointerEvents: 'none', zIndex: 9997,
          width: '100%', height: '100%',
        }}
      />
    </>
  )
}
