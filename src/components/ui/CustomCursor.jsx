import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, motion } from 'framer-motion'
import CannabisLeaf from './CannabisLeaf'

// Solo en dispositivos con puntero fino (desktop). No interfiere con móvil.
export default function CustomCursor() {
  const isPointer = useRef(
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
  )

  const rawX = useMotionValue(-100)
  const rawY = useMotionValue(-100)
  const x = useSpring(rawX, { stiffness: 420, damping: 30 })
  const y = useSpring(rawY, { stiffness: 420, damping: 30 })

  useEffect(() => {
    if (!isPointer.current) return
    document.documentElement.style.cursor = 'none'

    const move = (e) => {
      rawX.set(e.clientX - 12)
      rawY.set(e.clientY - 12)
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => {
      window.removeEventListener('mousemove', move)
      document.documentElement.style.cursor = ''
    }
  }, [rawX, rawY])

  if (!isPointer.current) return null

  return (
    <motion.div
      style={{
        x, y,
        position:      'fixed',
        top:           0,
        left:          0,
        width:         24,
        height:        24,
        pointerEvents: 'none',
        zIndex:        9999,
        rotate:        -25,
        filter:        'drop-shadow(0 0 5px rgba(0,230,118,0.8))',
      }}
    >
      <CannabisLeaf size={24} color="#00e676" />
    </motion.div>
  )
}
