import clsx from 'clsx'

export default function Spinner({ size = 'md', className }) {
  const s = { sm: 'w-4 h-4 border-[2px]', md: 'w-7 h-7 border-2', lg: 'w-11 h-11 border-[3px]' }
  return (
    <div className={clsx('rounded-full animate-spin', s[size], className)}
         style={{ borderColor: 'rgba(245,158,11,0.2)', borderTopColor: '#f59e0b' }} />
  )
}
