import { useState, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import CannabisLeaf from './CannabisLeaf'

const LEAF_SIZES  = { sm: 15, md: 20, lg: 34 }
const TEXT_SIZES  = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }

// Partícula individual que emana de la hoja
function Particle({ angle, dist }) {
  const rad = (angle * Math.PI) / 180
  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
      animate={{ x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, opacity: 0, scale: 0.3 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      style={{
        position:      'absolute',
        top:           '40%',
        left:          '40%',
        width:         4,
        height:        4,
        borderRadius:  '50%',
        background:    '#00e676',
        boxShadow:     '0 0 6px #00e676, 0 0 12px rgba(0,230,118,0.4)',
        pointerEvents: 'none',
        zIndex:        10,
      }}
    />
  )
}

export default function Logo({ size = 'md', className, withParticles = false }) {
  const uid = useId()
  const [particles, setParticles] = useState([])
  const throttle = useRef(false)

  const spawnParticles = () => {
    if (!withParticles || throttle.current) return
    throttle.current = true
    setTimeout(() => { throttle.current = false }, 400)

    const batch = Array.from({ length: 8 }, (_, i) => ({
      id:    `${uid}-${Date.now()}-${i}`,
      angle: (i / 8) * 360 + Math.random() * 20 - 10,
      dist:  24 + Math.random() * 16,
    }))
    setParticles(p => [...p, ...batch])
    setTimeout(() => setParticles(p => p.filter(x => !batch.some(b => b.id === x.id))), 600)
  }

  return (
    <span
      className={clsx('font-punk font-bold tracking-widest flex items-center gap-1.5 select-none', TEXT_SIZES[size], className)}
      onMouseEnter={spawnParticles}
      style={{ position: 'relative' }}
    >
      {/* Hoja con partículas */}
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <CannabisLeaf
          size={LEAF_SIZES[size]}
          color="#00e676"
          style={{ filter: 'drop-shadow(0 0 6px rgba(0,230,118,0.55))' }}
        />
        <AnimatePresence>
          {particles.map(p => <Particle key={p.id} angle={p.angle} dist={p.dist} />)}
        </AnimatePresence>
      </span>

      {/* Texto */}
      <span>
        <span style={{
          background: 'linear-gradient(90deg,#fcd34d,#f59e0b)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>ca</span>
        <span style={{
          color:  '#00e676',
          filter: 'drop-shadow(0 0 6px rgba(0,230,118,0.6))',
        }}>NN</span>
        <span style={{ color: '#fff' }}>apont</span>
      </span>
    </span>
  )
}
