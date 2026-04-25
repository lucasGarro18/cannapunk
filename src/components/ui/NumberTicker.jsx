import { useEffect, useRef } from 'react'
import { animate, useInView } from 'framer-motion'

export default function NumberTicker({
  num,
  prefix = '',
  suffix = '',
  decimals = 1,
  duration = 1.5,
  className = '',
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px' })

  useEffect(() => {
    if (!isInView || !ref.current) return
    const controls = animate(0, num, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        if (ref.current) ref.current.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`
      },
    })
    return () => controls.stop()
  }, [isInView])

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  )
}
