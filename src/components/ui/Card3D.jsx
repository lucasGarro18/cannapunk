import { createContext, useContext, useRef, useState } from 'react'

const TiltCtx = createContext({ x: 0, y: 0, active: false })

export function CardContainer({ children, className = '', style = {} }) {
  const ref = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false })

  const onMouseMove = (e) => {
    if (!ref.current) return
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    setTilt({ x: (e.clientX - left) / width - 0.5, y: (e.clientY - top) / height - 0.5, active: true })
  }

  const onMouseLeave = () => setTilt({ x: 0, y: 0, active: false })

  return (
    <TiltCtx.Provider value={tilt}>
      <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
           className={className} style={{ perspective: '1000px', ...style }}>
        {children}
      </div>
    </TiltCtx.Provider>
  )
}

export function CardBody({ as: Tag = 'div', children, className = '', style = {}, ...props }) {
  const { x, y, active } = useContext(TiltCtx)

  // Cursor position as 0-100 percentage
  const cx = (x + 0.5) * 100
  const cy = (y + 0.5) * 100
  // Specular highlight — opposite quadrant simulates light source
  const sx = 100 - cx
  const sy = 100 - cy
  // Prismatic angle shifts with tilt for rainbow edge effect
  const prismAngle = 120 + x * 60

  return (
    <Tag
      className={`relative ${className}`}
      style={{
        ...style,
        transform: active
          ? `perspective(1000px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg) scale3d(1.03,1.03,1.03)`
          : 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)',
        transition: active
          ? 'transform 0.06s linear, box-shadow 0.25s ease'
          : 'transform 0.6s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        boxShadow: active
          ? '0 24px 64px rgba(0,0,0,0.65), 0 8px 24px rgba(34,197,94,0.18), 0 0 0 1px rgba(34,197,94,0.12)'
          : '0 4px 16px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)',
      }}
      {...props}
    >
      {/* Holographic radial glow — green neon core */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-10 overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at ${cx}% ${cy}%,
            rgba(34,197,94,0.26) 0%,
            rgba(16,185,129,0.12) 28%,
            rgba(99,102,241,0.07) 52%,
            transparent 70%)`,
          opacity: active ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
      {/* Specular white sheen — simulates directional light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-10 overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at ${sx}% ${sy}%, rgba(255,255,255,0.1) 0%, transparent 48%)`,
          opacity: active ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
      />
      {/* Prismatic rainbow edge — holographic trading card effect */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-10"
        style={{
          background: `linear-gradient(${prismAngle}deg,
            transparent 12%,
            rgba(34,197,94,0.07) 24%,
            rgba(99,102,241,0.06) 38%,
            rgba(236,72,153,0.05) 52%,
            rgba(251,191,36,0.05) 65%,
            rgba(34,197,94,0.04) 76%,
            transparent 86%)`,
          opacity: active ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />
      {children}
    </Tag>
  )
}

export function CardItem({ as: Tag = 'div', children, className = '', translateZ = 0, style = {}, ...props }) {
  return (
    <Tag
      className={className}
      style={{ ...style, transform: `translateZ(${translateZ}px)`, transformStyle: 'preserve-3d' }}
      {...props}
    >
      {children}
    </Tag>
  )
}
