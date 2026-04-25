import clsx from 'clsx'

export default function StatCard({ label, value, sub, icon: Icon, color = 'neon', trend, className }) {
  const colors = {
    neon:   { text: 'text-brand-neon',    bg: 'bg-brand-neon/10',   border: 'border-brand-neon/20' },
    purple: { text: 'text-purple-400',    bg: 'bg-purple-500/10',   border: 'border-purple-500/20' },
    amber:  { text: 'text-amber-400',     bg: 'bg-amber-500/10',    border: 'border-amber-500/20' },
    blue:   { text: 'text-blue-400',      bg: 'bg-blue-500/10',     border: 'border-blue-500/20' },
    red:    { text: 'text-red-400',       bg: 'bg-red-500/10',      border: 'border-red-500/20' },
  }
  const c = colors[color]

  return (
    <div className={clsx('card p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {Icon && (
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', c.bg, `border ${c.border}`)}>
            <Icon size={16} className={c.text} />
          </div>
        )}
      </div>
      <div>
        <p className={clsx('text-2xl font-bold', c.text)}>{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <p className={clsx('text-xs font-medium', trend >= 0 ? 'text-brand-neon' : 'text-red-400')}>
          {trend >= 0 ? '+' : ''}{trend}% vs mes anterior
        </p>
      )}
    </div>
  )
}
