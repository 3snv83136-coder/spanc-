'use client'

import { useCallback, useEffect, useRef } from 'react'

interface Props {
  value?: string
  onChange: (dataUrl: string | undefined) => void
}

export default function SignaturePad({ value, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  const redraw = useCallback((dataUrl?: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (dataUrl) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = dataUrl
    }
  }, [])

  useEffect(() => { redraw(value) }, [value, redraw])

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const r = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    }
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const p = pos(e)
    ctx.strokeStyle = '#0e2a52'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    canvas.setPointerCapture(e.pointerId)
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const p = pos(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
  }

  function end() {
    if (!drawing.current) return
    drawing.current = false
    onChange(canvasRef.current?.toDataURL('image/png'))
  }

  function clear() {
    onChange(undefined)
    redraw()
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={600}
        height={160}
        className="w-full h-40 rounded-xl border-2 border-[#007B7F]/50 bg-white touch-none cursor-crosshair"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="flex justify-between items-center text-xs text-white/50">
        <span>Signez avec le doigt ou la souris</span>
        <button type="button" onClick={clear} className="text-red-300 font-bold underline">Effacer</button>
      </div>
    </div>
  )
}
