import { useRef, useState } from 'react'

export default function Spotlight({ children, className = '', color = 'rgba(245,158,11,0.07)' }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  const onMouseMove = (e) => {
    if (!ref.current) return
    const { left, top } = ref.current.getBoundingClientRect()
    setPos({ x: e.clientX - left, y: e.clientY - top })
  }

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-500"
        style={{
          opacity: visible ? 1 : 0,
          background: `radial-gradient(500px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 40%)`,
        }}
      />
      {children}
    </div>
  )
}
