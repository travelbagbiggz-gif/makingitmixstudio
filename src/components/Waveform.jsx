import React, { useEffect, useRef } from 'react'

function Waveform() {
  const canvasRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    // Draw animated waveform
    const draw = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)'
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin((x + Date.now() * 0.001) * 0.01) * (h / 4)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      requestAnimationFrame(draw)
    }

    draw()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      className="w-full rounded-lg border border-blue-500/30"
      style={{ background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.05), rgba(15, 23, 42, 0.5))' }}
    />
  )
}

export default Waveform
