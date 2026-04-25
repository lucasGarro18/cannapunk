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
           className={className} style={{ perspective: '800px', ...style }}>
        {children}
      </div>
    </TiltCtx.Provider>
  )
}

export function CardBody({ as: Tag = 'div', children, className = '', style = {}, ...props }) {
  const { x, y, active } = useContext(TiltCtx)
  const cx = (x + 0.5) * 100
  const cy = (y + 0.5) * 100
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        ...style,
        transform: active
          ? `perspective(900px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg) scale3d(1.03,1.03,1.03)`
          : 'perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)',
        transition: active ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      {...props}
    >
      {/* Ambient holographic glow — amber center, violet edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-10"
        style={{
          background: `radial-gradient(circle at ${cx}% ${cy}%,
            rgba(245,158,11,0.16) 0%,
            rgba(139,92,246,0.06) 45%,
            transparent 68%)`,
          opacity: active ? 1 : 0,
          transition: 'opacity 0.25s ease',
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
