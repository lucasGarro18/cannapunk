import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LEAF_PATHS } from './CannabisLeaf'

const SESSION_KEY = 'cannapont-loaded'

export default function LoadingScreen() {
  const [visible, setVisible] = useState(
    () => typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(SESSION_KEY)
  )
  const [filled, setFilled] = useState(false)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    if (!visible) return
    const t1 = setTimeout(() => setFilled(true),    1800)
    const t2 = setTimeout(() => setShowText(true),  1400)
    const t3 = setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem(SESSION_KEY, '1')
    }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: 'easeInOut' } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: '#0c0c0e',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 28,
          }}
        >
          {/* Hoja animada */}
          <svg width="130" height="130" viewBox="0 0 100 100">
            <defs>
              <filter id="ls-glow">
                <feGaussianBlur stdDeviation="2.5" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <g transform="translate(50,65)" filter="url(#ls-glow)">
              {LEAF_PATHS.map(({ d, transform: t }, i) => (
                <g key={i} transform={t || undefined}>
                  <motion.path
                    d={d}
                    fill="#00e676"
                    stroke="#00e676"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
                    animate={{
                      pathLength:    1,
                      fillOpacity:   filled ? 1 : 0,
                      strokeOpacity: filled ? 0 : 1,
                    }}
                    transition={{
                      pathLength:  { duration: 1.0, ease: 'easeInOut', delay: i * 0.14 },
                      fillOpacity: { duration: 0.4 },
                      strokeOpacity: { duration: 0.3 },
                    }}
                  />
                </g>
              ))}
              {/* Tallo */}
              <motion.rect
                x="-1.5" y="0" width="3" height="22" rx="1.5"
                fill="#00e676"
                initial={{ scaleY: 0, originY: '0%' }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.7, duration: 0.5, ease: 'easeOut' }}
                style={{ transformOrigin: 'top' }}
              />
            </g>
          </svg>

          {/* Logo text */}
          <AnimatePresence>
            {showText && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="font-punk font-bold tracking-widest text-4xl"
              >
                <span style={{
                  background: 'linear-gradient(90deg,#fcd34d,#f59e0b)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>ca</span>
                <span style={{ color: '#00e676', filter: 'drop-shadow(0 0 8px rgba(0,230,118,0.7))' }}>NN</span>
                <span style={{ color: '#fff' }}>apont</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Barra de progreso */}
          <motion.div
            style={{ width: 80, height: 2, background: '#1c1c1f', borderRadius: 2, overflow: 'hidden' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.8, ease: 'linear' }}
              style={{ height: '100%', background: '#00e676', borderRadius: 2 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
