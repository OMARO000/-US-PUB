"use client"
import { useEffect, useRef, useState } from "react"

export default function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [blendMode, setBlendMode] = useState<string>("overlay")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const W = 256
    const H = 256
    canvas.width = W
    canvas.height = H

    const imageData = ctx.createImageData(W, H)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.floor(Math.random() * 255)
      data[i] = v
      data[i + 1] = v
      data[i + 2] = v
      data[i + 3] = 255
    }
    ctx.putImageData(imageData, 0, 0)
  }, [])

  useEffect(() => {
    const updateBlend = () => {
      const theme = document.documentElement.getAttribute("data-theme")
      setBlendMode(theme === "light" ? "multiply" : "overlay")
    }
    updateBlend()
    const observer = new MutationObserver(updateBlend)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
        opacity: blendMode === "multiply" ? 0.05 : 0.08,
        mixBlendMode: blendMode as any,
      }}
    />
  )
}
