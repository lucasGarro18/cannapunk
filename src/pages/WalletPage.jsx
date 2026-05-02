import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  RiArrowDownLine, RiArrowUpLine, RiWallet3Line,
  RiGiftLine, RiExchangeLine, RiCheckDoubleLine, RiCloseLine,
  RiWifiOffLine, RiRefreshLine,
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/utils/format'
import { useWallet, useWithdraw } from '@/hooks/useWallet'
import { useAuthStore } from '@/store/authStore'
import StatCard from '@/components/ui/StatCard'
import Spinner from '@/components/ui/Spinner'
import clsx from 'clsx'

const TX_META = {
  commission: { icon: RiArrowUpLine,   color: '#f59e0b',  bg: 'rgba(245,158,11,0.1)',  label: 'Comisión'  },
  withdrawal: { icon: RiArrowDownLine, color: '#f87171',  bg: 'rgba(239,68,68,0.1)',  label: 'Retiro'    },
  bonus:      { icon: RiGiftLine,      color: '#fbbf24',  bg: 'rgba(245,158,11,0.1)', label: 'Bonus'     },
  refund:     { icon: RiExchangeLine,  color: '#60a5fa',  bg: 'rgba(59,130,246,0.1)', label: 'Reembolso' },
}

// Methods se construye dinámicamente con los datos del usuario

const TX_TABS = [
  { id: 'all',        label: 'Todos'      },
  { id: 'commission', label: 'Comisiones' },
  { id: 'withdrawal', label: 'Retiros'    },
  { id: 'bonus',      label: 'Bonos'      },
]

export default function WalletPage() {
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [amount,       setAmount]       = useState('')
  const [method,       setMethod]       = useState('cbu')
  const [tab,          setTab]          = useState('all')

  const { data, isLoading, isError, refetch } = useWallet()
  const { mutate: withdraw, isLoading: confirming } = useWithdraw()
  const { user } = useAuthStore()

  const METHODS = [
    user?.payoutCbu   && { id: 'cbu',     label: 'CBU / CVU',      sub: user.payoutCbu,   emoji: '🏦' },
    user?.payoutMp    && { id: 'mercado', label: 'Mercado Pago',   sub: user.payoutMp,    emoji: '💙' },
    user?.payoutUsdt  && { id: 'crypto',  label: 'USDT (Polygon)', sub: user.payoutUsdt,  emoji: '🔷' },
  ].filter(Boolean)
  const balance      = data?.balance      ?? data?.paidOut      ?? 0
  const pending      = data?.pendingPayout ?? data?.pending     ?? 0
  const totalEarned  = data?.totalEarned                        ?? 0
  const transactions = data?.transactions ?? (data?.recentCommissions ?? []).map(c => ({
    id: c.id, type: 'commission', label: c.video?.title ?? 'Comisión', amount: c.amount,
    date: new Date(c.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
  }))

  const filtered = tab === 'all'
    ? transactions
    : transactions.filter(t => t.type === tab)

  const handleWithdraw = () => {
    if (!amount || Number(amount) <= 0) return
    withdraw(
      { amount: Number(amount), method },
      {
        onSuccess: () => {
          setWithdrawOpen(false)
          setAmount('')
        },
      },
    )
  }

  if (isError) return (
    <div className="max-w-xl mx-auto px-4 py-24 flex flex-col items-center text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
           style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <RiWifiOffLine size={28} style={{ color: '#f87171' }} />
      </div>
      <div>
        <p className="font-semibold">No se pudo cargar tu wallet</p>
        <p className="text-sm text-gray-600 mt-1">Revisá tu conexión e intentá de nuevo</p>
      </div>
      <button onClick={() => refetch()} className="btn-primary gap-2 text-sm">
        <RiRefreshLine size={15} /> Reintentar
      </button>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-5">

      {/* Header */}
      <div>
        <p className="label mb-1">Finanzas</p>
        <h1 className="section-title" style={{ fontSize: '1.75rem' }}>
          Mi <span className="neon-text">Wallet</span>
        </h1>
      </div>

      {/* Balance card */}
      <div className="card relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #1c1c1f 0%, #111113 100%)' }}>
        {/* Glow blob */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full blur-3xl pointer-events-none"
             style={{ background: 'rgba(245,158,11,0.15)' }} />

        <div className="relative p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="label">Saldo disponible</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <RiWallet3Line size={17} style={{ color: '#f59e0b' }} />
            </div>
          </div>

          <div>
            <p className="neon-text font-bold" style={{ fontSize: '2.25rem', letterSpacing: '-0.02em' }}>
              {formatCurrency(balance)}
            </p>
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#4b5563' }}>
              <RiCheckDoubleLine size={13} />
              {formatCurrency(pending)} pendiente de acreditación
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setWithdrawOpen(true)} className="btn-primary flex-1 py-2.5 gap-2">
              <RiArrowDownLine size={16} /> Retirar
            </button>
            <button onClick={() => toast('Función disponible próximamente', { icon: '📜' })}
                    className="btn-secondary flex-1 py-2.5 gap-2">
              <RiArrowUpLine size={16} /> Cargar
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total ganado"   value={formatCurrency(totalEarned)} icon={RiArrowUpLine}   color="neon"   trend={22} />
        <StatCard label="Videos activos" value={data?.totalVideos ?? 0}        icon={RiCheckDoubleLine} color="purple" />
      </div>

      {/* Withdraw panel */}
      {withdrawOpen && (
        <div className="card p-5 space-y-4"
             style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.03)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Retirar fondos</h3>
            <button onClick={() => setWithdrawOpen(false)} className="btn-icon w-7 h-7">
              <RiCloseLine size={16} />
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="label block mb-2">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#4b5563' }}>$</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                     placeholder="0" className="input" style={{ paddingLeft: '1.75rem' }} />
            </div>
            <div className="flex gap-2 mt-2">
              {[25000, 50000, balance].map(v => (
                <button key={v} onClick={() => setAmount(String(v))}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ border: '1px solid #27272a', color: '#6b7280' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'; e.currentTarget.style.color = '#f59e0b' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = '#6b7280' }}>
                  {v === balance ? 'Todo' : formatCurrency(v)}
                </button>
              ))}
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="label block mb-2">Método de cobro</label>
            {METHODS.length === 0 && (
              <p className="text-xs text-gray-500 mb-2">
                No tenés métodos configurados.{' '}
                <Link to="/settings" className="text-brand-neon underline">Configurar en ajustes →</Link>
              </p>
            )}
            <div className="space-y-2">
              {METHODS.map(m => (
                <label key={m.id}
                       className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                       style={{
                         border: `1px solid ${method === m.id ? 'rgba(245,158,11,0.4)' : '#27272a'}`,
                         background: method === m.id ? 'rgba(245,158,11,0.05)' : 'transparent',
                       }}>
                  <input type="radio" name="method" value={m.id} checked={method === m.id}
                         onChange={() => setMethod(m.id)}
                         style={{ accentColor: '#f59e0b' }} />
                  <span className="text-lg">{m.emoji}</span>
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs" style={{ color: '#4b5563' }}>{m.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button onClick={handleWithdraw} disabled={!amount || confirming || METHODS.length === 0} className="btn-primary w-full py-3 gap-2">
            {confirming ? <><Spinner size="sm" /> Procesando...</> : `Confirmar retiro${amount ? ` de ${formatCurrency(Number(amount))}` : ''}`}
          </button>
        </div>
      )}

      {/* Transaction history */}
      <div className="card overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid #27272a' }}>
          <h2 className="font-semibold">Historial de movimientos</h2>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1px solid #27272a' }}>
          {TX_TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
                    className="flex-1 py-2.5 text-xs font-medium transition-colors"
                    style={tab === id
                      ? { color: '#f59e0b', borderBottom: '2px solid #f59e0b' }
                      : { color: '#4b5563', borderBottom: '2px solid transparent' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Transactions */}
        <div>
          {filtered.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: '#374151' }}>Sin movimientos</p>
          ) : (
            filtered.map(tx => {
              const meta = TX_META[tx.type] ?? TX_META.commission
              const Icon = meta.icon
              return (
                <div key={tx.id} className="flex items-center gap-3 p-4 transition-colors"
                     style={{ borderBottom: '1px solid #27272a' }}
                     onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                     onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: meta.bg }}>
                    <Icon size={16} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>{meta.label} · {tx.date}</p>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0"
                     style={{ color: tx.amount > 0 ? '#f59e0b' : '#f87171' }}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
