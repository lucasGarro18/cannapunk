import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiShoppingBag3Line, RiTruckLine, RiCheckLine,
  RiTimeLine, RiArrowRightLine, RiCheckDoubleLine,
  RiWifiOffLine, RiRefreshLine,
} from 'react-icons/ri'
import { useOrders } from '@/hooks/useOrders'
import { ListItemSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/utils/format'
import clsx from 'clsx'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const fadeUp  = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16,1,0.3,1] } } }

const STATUS = {
  delivered:  { label: 'Entregado',      color: '#f59e0b',  bg: 'rgba(245,158,11,0.12)',  icon: RiCheckLine    },
  shipping:   { label: 'En camino',      color: '#60a5fa',  bg: 'rgba(59,130,246,0.12)', icon: RiTruckLine    },
  pickup:     { label: 'Listo p/ retirar', color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', icon: RiTruckLine   },
  processing: { label: 'Preparando',     color: '#fbbf24',  bg: 'rgba(245,158,11,0.12)', icon: RiTimeLine     },
  cancelled:  { label: 'Cancelado',      color: '#f87171',  bg: 'rgba(239,68,68,0.12)',  icon: RiTimeLine     },
}

const TABS = ['Todos', 'En proceso', 'Enviados', 'Entregados']

function getTracking(order) {
  if (order.tracking) return order.tracking
  const s = order.status
  return {
    carrier: 'En preparación',
    trackingCode: null,
    steps: [
      { label: 'Pedido confirmado', done: true,                                              date: new Date(order.createdAt).toLocaleDateString('es-AR') },
      { label: 'En preparación',    done: ['pickup','shipping','delivered'].includes(s),     date: null },
      { label: 'En camino',         done: ['shipping','delivered'].includes(s),             date: null },
      { label: 'Entregado',         done: s === 'delivered',                                date: null },
    ],
  }
}

export default function OrdersPage() {
  const [tab, setTab] = useState('Todos')
  const [searchParams] = useSearchParams()
  const justConfirmed = searchParams.get('confirmed') === '1' || searchParams.get('payment') === 'success'
  const { data: orders = [], isLoading, isError, refetch } = useOrders()

  const filtered = orders.filter(o => {
    if (tab === 'Todos')      return true
    if (tab === 'En proceso') return ['processing', 'pickup'].includes(o.status)
    if (tab === 'Enviados')   return o.status === 'shipping'
    if (tab === 'Entregados') return o.status === 'delivered'
    return true
  })

  if (isError) return (
    <div className="max-w-xl mx-auto px-4 py-24 flex flex-col items-center text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
           style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <RiWifiOffLine size={28} style={{ color: '#f87171' }} />
      </div>
      <div>
        <p className="font-semibold">No se pudieron cargar tus pedidos</p>
        <p className="text-sm text-gray-600 mt-1">Revisá tu conexión e intentá de nuevo</p>
      </div>
      <button onClick={() => refetch()} className="btn-primary gap-2 text-sm">
        <RiRefreshLine size={15} /> Reintentar
      </button>
    </div>
  )

  return (
    <motion.div
      className="max-w-xl mx-auto px-4 py-8 space-y-5"
      variants={stagger} initial="hidden" animate="show"
    >

      {/* Confirmación de compra */}
      <AnimatePresence>
        {justConfirmed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(245,158,11,0.15)' }}>
              <RiCheckDoubleLine size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <p className="text-sm font-semibold neon-text">¡Pedido confirmado!</p>
              <p className="text-xs text-gray-500 mt-0.5">Tu pago fue procesado. Estamos preparando tu envío.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={fadeUp}>
        <p className="label mb-1">Compras</p>
        <h1 className="section-title" style={{ fontSize: '1.75rem' }}>
          Mis <span className="neon-text">pedidos</span>
        </h1>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp}
        className="flex gap-1 p-1 rounded-xl relative"
        style={{ border: '1px solid #27272a', background: '#111115' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
                  className="flex-1 py-2 px-1.5 rounded-lg text-xs font-medium transition-colors relative z-10"
                  style={tab === t ? { color: '#0c0c0e' } : { color: '#4b5563' }}>
            {tab === t && (
              <motion.span layoutId="orders-tab-bg"
                className="absolute inset-0 rounded-lg"
                style={{ background: '#f59e0b' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <ListItemSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp} className="text-center py-16" style={{ color: '#374151' }}>
          <RiShoppingBag3Line size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay pedidos en esta categoría</p>
        </motion.div>
      ) : (
        <motion.div className="space-y-3" variants={stagger}>
          {filtered.map(order => {
            const { icon: Icon, label, color, bg } = STATUS[order.status] ?? STATUS.processing
            const tracking = getTracking(order)
            const done  = tracking.steps.filter(s => s.done).length
            const total = tracking.steps.length
            const pct   = Math.round((done / total) * 100)

            return (
              <motion.div key={order.id} variants={fadeUp}
                          whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
                <Link to={`/orders/${order.id}`} className="card-hover block p-4 space-y-3.5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 w-fit"
                           style={{ background: bg, border: `1px solid ${color}30` }}>
                        <Icon size={11} style={{ color }} />
                        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                      </div>
                      <p className="font-semibold text-sm">{order.id}</p>
                      <p className="text-xs" style={{ color: '#4b5563' }}>
                        {new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                        {' · '}{tracking.carrier}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-white">{formatCurrency(order.total)}</p>
                      {order.earnedCommission > 0 && (
                        <p className="text-xs neon-text mt-0.5">
                          +{formatCurrency(order.earnedCommission)} comisión
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Product thumbnails */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map(({ product }, i) => (
                        <img key={i} src={product.imageUrl} alt={product.name}
                             className="w-10 h-10 rounded-lg object-cover"
                             style={{ border: '2px solid #18181c' }} />
                      ))}
                    </div>
                    <p className="text-xs flex-1 truncate" style={{ color: '#4b5563' }}>
                      {order.items.map(i => i.product.name).join(', ')}
                    </p>
                    <RiArrowRightLine size={15} style={{ color: '#374151', flexShrink: 0 }} />
                  </div>

                  {/* Progress bar */}
                  {order.status !== 'cancelled' && (
                    <div className="space-y-1.5">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#27272a' }}>
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          style={{ background: '#f59e0b' }}
                        />
                      </div>
                      <div className="flex justify-between text-xs" style={{ color: '#374151' }}>
                        <span>Confirmado</span>
                        <span style={{ color: pct === 100 ? '#f59e0b' : '#374151' }}>{pct}%</span>
                        <span>Entregado</span>
                      </div>
                    </div>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
