import clsx from 'clsx'

const variants = {
  neon:    'bg-brand-neon/20 text-brand-neon border border-brand-neon/40',
  green:   'bg-green-500/20 text-green-400 border border-green-500/40',
  purple:  'bg-purple-500/20 text-purple-400 border border-purple-500/40',
  pink:    'bg-pink-500/20 text-pink-400 border border-pink-500/40',
  yellow:  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  red:     'bg-red-500/20 text-red-400 border border-red-500/40',
  gray:    'bg-white/10 text-gray-400 border border-white/20',
}

export default function Badge({ children, variant = 'gray', className }) {
  return (
    <span className={clsx('tag', variants[variant], className)}>
      {children}
    </span>
  )
}
