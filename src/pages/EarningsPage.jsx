import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  RiMoneyDollarCircleLine, RiVideoLine, RiArrowUpLine,
  RiArrowRightLine, RiBarChartLine, RiCalendarLine,
  RiTrophyLine, RiFlashlightLine, RiWifiOffLine, RiRefreshLine,
} from 'react-icons/ri'
import StatCard from '@/components/ui/StatCard'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/utils/format'
import { useWallet } from '@/hooks/useWallet'
import BorderBeam from '@/components/ui/BorderBeam'
import NumberTicker from '@/components/ui/NumberTicker'

const MONTHLY_GOAL = 100000

export default function EarningsPage() {
  const { data, isLoading, isError, refetch } = useWallet()
  const totalEarned  = data?.totalEarned                        ?? 0
  const balance      = data?.paidOut     ?? data?.balance       ?? 0
  const pending      = data?.pendingPayout ?? data?.pending     ?? 0
  const monthEarned  = data?.monthEarned                        ?? 0
  const topVideos    = data?.topVideos                          ?? []
  const totalVideos  = data?.totalVideos                        ?? 0
  const transactions = data?.transactions ?? (data?.recentCommissions ?? []).map(c => ({
    id: c.id, label: c.video?.title ?? 'Comisión', amount: c.amount,
    date: new Date(c.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
  }))

  const monthPct = Math.min(100, Math.round((monthEarned / MONTHLY_GOAL) * 100))
  const maxEarned = topVideos.length > 0 ? Math.max(...topVideos.map(v => v.earned)) : 1

  if (isError) return (
    <div className="max-w-xl mx-auto px-4 py-24 flex flex-col items-center text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
           style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <RiWifiOffLine size={28} style={{ color: '#f87171' }} />
      </div>
      <div>
        <p className="font-semibold">No se pudieron cargar tus ganancias</p>
        <p className="text-sm text-gray-600 mt-1">Revisá tu conexión e intentá de nuevo</p>
      </div>
      <button onClick={() => refetch()} className="btn-primary gap-2 text-sm">
        <RiRefreshLine size={15} /> Reintentar
      </button>
    </div>
  )

  return (
    <motion.div
      className="max-w-3xl mx-auto px-4 py-8 space-y-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
    >
      <div>
        <p className="label mb-1">Dashboard</p>
        <h1 className="section-title text-3xl">
          Mis <span className="neon-text">ganancias</span>
        </h1>
      </div>

      {/* Hero stat — Total ganado */}
      {!isLoading && (
        <motion.div
          className="relative overflow-hidden rounded-3xl p-6"
          style={{
            background: 'linear-gradient(var(--cp-card), var(--cp-card)) padding-box, linear-gradient(135deg, rgba(0,230,118,0.3) 0%, transparent 50%, rgba(245,158,11,0.1) 100%) border-box',
            border: '1px solid transparent',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <BorderBeam colorFrom="#00e676" colorTo="#f59e0b" duration={9} />
          <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
               style={{ background: 'radial-gradient(circle at 100% 0%, rgba(0,230,118,0.07) 0%, transparent 65%)' }} />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: '#3d3d42' }}>
                Total ganado
              </p>
              <p
                className="font-black leading-none"
                style={{ fontSize: 'clamp(2.4rem, 8vw, 3.2rem)', color: '#00e676', textShadow: '0 0 48px rgba(0,230,118,0.4)' }}
              >
                {totalEarned >= 1000
                  ? <NumberTicker num={totalEarned / 1000} decimals={1} prefix="$" suffix="K" />
                  : formatCurrency(totalEarned)}
              </p>
              {balance > 0 && (
                <p className="text-xs mt-2 font-mono" style={{ color: 'rgba(0,230,118,0.5)' }}>
                  {formatCurrency(balance)} disponible para retirar
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1"
                 style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.18)' }}>
              <RiFlashlightLine size={22} style={{ color: '#00e676' }} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {isLoading ? [...Array(3)].map((_, i) => <StatCardSkeleton key={i} />) : <>
          <StatCard label="Saldo disponible" value={formatCurrency(balance)}
                    icon={RiArrowUpLine}           color="purple" />
          <StatCard label="Este mes"         value={formatCurrency(monthEarned)}
                    icon={RiCalendarLine}          color="amber"  trend={22} />
          <StatCard label="Videos activos"   value={totalVideos}
                    icon={RiVideoLine}             color="blue"   />
        </>}
      </div>

      {/* Monthly goal */}
      <div className="card p-5 space-y-3"
           style={{ border: '1px solid rgba(245,158,11,0.12)', background: 'rgba(245,158,11,0.02)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiFlashlightLine size={15} style={{ color: '#f59e0b' }} />
            <p className="text-sm font-semibold">Meta del mes</p>
          </div>
          <p className="text-xs" style={{ color: '#52525b' }}>
            {formatCurrency(monthEarned)} / {formatCurrency(MONTHLY_GOAL)}
          </p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1c1c1f' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b, #fcd34d)' }}
            initial={{ width: 0 }}
            animate={{ width: `${monthPct}%` }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16,1,0.3,1] }}
          />
        </div>
        <p className="text-xs" style={{ color: '#52525b' }}>
          {monthPct >= 100
            ? 'Meta alcanzada este mes'
            : `Falta ${formatCurrency(MONTHLY_GOAL - monthEarned)} para la meta`}
        </p>
      </div>

      {/* Withdraw shortcut */}
      <div className="card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="label mb-1">Listo para retirar</p>
          <p className="text-3xl font-bold neon-text">{formatCurrency(balance)}</p>
          {pending > 0 && (
            <p className="text-xs mt-1" style={{ color: '#52525b' }}>
              +{formatCurrency(pending)} pendiente de acreditación
            </p>
          )}
        </div>
        <Link to="/wallet" className="btn-primary gap-2 flex-shrink-0">
          Ir a Wallet <RiArrowRightLine size={15} />
        </Link>
      </div>

      {/* Top videos — bar chart */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-brand-border flex items-center gap-2">
          <RiTrophyLine size={16} className="text-brand-neon" />
          <h2 className="font-semibold">Videos más rentables</h2>
        </div>
        {topVideos.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-700">
            Aún no generaste comisiones.{' '}
            <Link to="/upload" className="text-brand-neon hover:underline">Subí tu primer video →</Link>
          </p>
        ) : (
          <div className="p-4 space-y-4">
            {topVideos.map((v, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold w-5 flex-shrink-0"
                          style={{ color: i === 0 ? '#fbbf24' : '#4b5563' }}>
                      #{i + 1}
                    </span>
                    <p className="text-sm truncate">{v.title}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold neon-text">{formatCurrency(v.earned)}</p>
                    <p className="text-xs text-gray-600">{v.conversions} ventas</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#27272a' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                       style={{
                         width: `${Math.round((v.earned / maxEarned) * 100)}%`,
                         background: i === 0
                           ? 'linear-gradient(90deg, #d97706, #fcd34d)'
                           : 'linear-gradient(90deg, #52525b, #71717a)',
                       }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiBarChartLine size={16} className="text-brand-neon" />
            <h2 className="font-semibold">Transacciones recientes</h2>
          </div>
          <Link to="/wallet" className="text-xs text-brand-neon hover:underline">Ver todo</Link>
        </div>
        <div className="divide-y divide-brand-border">
          {transactions.length === 0 && (
            <p className="p-6 text-center text-sm text-gray-700">Sin transacciones todavía</p>
          )}
          {transactions.slice(0, 5).map(tx => (
            <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{tx.date}</p>
              </div>
              <p className={`text-sm font-bold flex-shrink-0 ${tx.amount > 0 ? 'text-brand-neon' : 'text-red-400'}`}>
                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
