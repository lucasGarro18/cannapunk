export default function Marquee({
  children,
  speed = 40,
  reverse = false,
  pauseOnHover = true,
  gap = 12,
  className = '',
}) {
  const trackStyle = {
    gap: `${gap}px`,
    animationName: 'marquee-scroll',
    animationDuration: `${speed}s`,
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    animationDirection: reverse ? 'reverse' : 'normal',
  }

  const handleEnter = pauseOnHover
    ? e => { e.currentTarget.style.animationPlayState = 'paused' }
    : undefined
  const handleLeave = pauseOnHover
    ? e => { e.currentTarget.style.animationPlayState = 'running' }
    : undefined

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ maskImage: 'linear-gradient(to right, transparent, white 8%, white 92%, transparent)' }}
    >
      <div
        className="flex will-change-transform"
        style={trackStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <div className="flex flex-shrink-0 items-center" style={{ gap: `${gap}px` }}>
          {children}
        </div>
        <div className="flex flex-shrink-0 items-center" aria-hidden style={{ gap: `${gap}px` }}>
          {children}
        </div>
      </div>
    </div>
  )
}
