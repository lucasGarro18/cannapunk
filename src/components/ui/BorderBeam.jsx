export default function BorderBeam({
  duration = 8,
  colorFrom = '#22c55e',
  colorTo = '#8b5cf6',
}) {
  return (
    <div
      aria-hidden
      className="border-beam-effect"
      style={{
        '--beam-from': colorFrom,
        '--beam-to': colorTo,
        '--beam-duration': `${duration}s`,
      }}
    />
  )
}
