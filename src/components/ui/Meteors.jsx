import { useMemo } from 'react'

export default function Meteors({ count = 15, className = '' }) {
  const meteors = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      top:      `${(Math.random() * 60 - 15).toFixed(0)}%`,
      left:     `${(Math.random() * 110 - 5).toFixed(0)}%`,
      delay:    `${(Math.random() * 12).toFixed(2)}s`,
      duration: `${(Math.random() * 5 + 5).toFixed(2)}s`,
      width:    Math.floor(Math.random() * 70 + 30),
      opacity:  (Math.random() * 0.35 + 0.45).toFixed(2),
    })),
    []
  )

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {meteors.map(m => (
        <span
          key={m.id}
          className="absolute rounded-full"
          style={{
            top:             m.top,
            left:            m.left,
            width:           `${m.width}px`,
            height:          '1px',
            opacity:         m.opacity,
            background:      'linear-gradient(90deg, rgba(245,158,11,0.95) 0%, rgba(245,158,11,0.5) 35%, transparent 100%)',
            transform:       'rotate(215deg)',
            animationName:   'meteor-fall',
            animationTimingFunction:  'linear',
            animationIterationCount:  'infinite',
            animationDelay:    m.delay,
            animationDuration: m.duration,
          }}
        />
      ))}
    </div>
  )
}
