import clsx from 'clsx'

export default function Logo({ size = 'md', className }) {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }
  return (
    <span className={clsx('font-punk font-bold tracking-widest', sizes[size], className)}>
      <span style={{
        background: 'linear-gradient(90deg, #fcd34d, #f59e0b)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 0 12px rgba(245,158,11,0.5))',
      }}>ca</span>
      <span style={{
        color: '#22c55e',
        filter: 'drop-shadow(0 0 10px rgba(34,197,94,0.6))',
      }}>NN</span>
      <span className="text-white">apont</span>
    </span>
  )
}
