import clsx from 'clsx'

const sizes = {
  xs:  'w-6 h-6   text-[10px]',
  sm:  'w-8 h-8   text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-14 h-14 text-lg',
  xl:  'w-20 h-20 text-2xl',
  '2xl': 'w-28 h-28 text-3xl',
}

export default function Avatar({ src, name, size = 'md', className, online, ring }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className={clsx('relative flex-shrink-0', className)}>
      <div className={clsx(
        'rounded-full overflow-hidden flex items-center justify-center font-semibold',
        'border-2 border-brand-border',
        ring && 'ring-neon',
        sizes[size],
      )}
        style={{ background: 'linear-gradient(135deg, #1e3a1e 0%, #2a1a4e 100%)' }}
      >
        {src
          ? <img src={src} alt={name} className="w-full h-full object-cover" />
          : <span className="text-brand-neon">{initials}</span>
        }
      </div>
      {online && (
        <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-brand-dark"
              style={{ background: '#f59e0b' }} />
      )}
    </div>
  )
}
