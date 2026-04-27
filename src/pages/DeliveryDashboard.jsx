import { useState } from 'react'
import {
  RiMotorbikeLine, RiMapPinLine, RiCheckLine,
  RiTruckLine, RiMoneyDollarCircleLine, RiTimeLine,
  RiWifiOffLine, RiRefreshLine,
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import StatCard from '@/components/ui/StatCard'
import { useDeliveryOrders, useAdvanceOrderStatus } from '@/hooks/useOrders'
import { formatCurrency } from '@/utils/format'
import clsx from 'clsx'

const STEP_LABELS = {
  processing: { label: 'Listo para retirar', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', action: 'Confirmar retiro',   next: 'pickup'     },
  pickup:     { label: 'En camino',          color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', action: 'Confirmar entrega', next: 'delivered'  },
  shipping:   { label: 'En camino',          color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', action: 'Confirmar entrega', next: 'delivered'  },
  delivered:  { label: 'Entregado',          color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  action: null,                next: null         },
}

const EARN_PER_DELIVERY = 1500

export default function DeliveryDashboard() {
  const { data: baseOrders = [], isError, refetch } = useDeliveryOrders()
  const { mutate: advanceStatus }  = useAdvanceOrderStatus()
  const [statusOverrides, setStatusOverrides] = useState({})

  const orders = baseOrders.map(o => ({
    ...o,
    deliveryStatus: statusOverrides[o.id] ?? o.status,
  }))

  const delivered   = orders.filter(o => o.deliveryStatus === 'delivered').length
  const inProgress  = orders.filter(o => o.deliveryStatus !== 'delivered').length
  const todayEarned = delivered * EARN_PER_DELIVERY

  const handleAdvance = (id) => {
    const order   = orders.find(o => o.id === id)
    if (!order) return
    const current = STEP_LABELS[order.deliveryStatus] ?? STEP_LABELS.processing
    if (!current.next) return
    const next = current.next
    // Optimistic local update
    setStatusOverrides(prev => ({ ...prev, [id]: next }))
    advanceStatus(
      { id, status: next },
      {
        onSuccess: () => {
          if (next === 'delivered') toast.success(`Entrega ${id} completada! +${formatCurrency(EARN_PER_DELIVERY)} acreditados`)
          else toast.success('Retiro confirmado — ¡En camino!')
        },
        onError: () => {
          // Revert optimistic update
          setStatusOverrides(prev => { const s = { ...prev }; delete s[id]; return s })
          toast.error('Error al actualizar el estado')
        },
      },
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div>
        <p className="label mb-1">Panel de repartidor</p>
        <h1 className="section-title" style={{ fontSize: '1.75rem' }}>
          Mis <span className="neon-text">entregas</span>
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="En curso"        value={inProgress}               icon={RiTruckLine}             color="blue"   />
        <StatCard label="Completadas hoy" value={delivered}                icon={RiCheckLine}             color="neon"   />
        <StatCard label="Ganado hoy"      value={formatCurrency(todayEarned)} icon={RiMoneyDollarCircleLine} color="amber"  />
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {isError && (
          <div className="card p-8 flex flex-col items-center gap-3 text-center">
            <RiWifiOffLine size={32} className="text-gray-600" />
            <p className="text-sm text-gray-500">No se pudieron cargar las entregas</p>
            <button onClick={() => refetch()} className="btn-secondary gap-2 text-sm">
              <RiRefreshLine size={15} /> Reintentar
            </button>
          </div>
        )}
        {!isError && orders.length === 0 && (
          <div className="text-center py-16 text-gray-700">
            <RiMotorbikeLine size={36} className="mx-auto opacity-30 mb-3" />
            <p className="text-sm">No tenés entregas asignadas</p>
          </div>
        )}
        {!isError && orders.map(order => {
          const meta   = STEP_LABELS[order.deliveryStatus] ?? STEP_LABELS.processing
          const done   = order.deliveryStatus === 'delivered'
          const earned = done ? EARN_PER_DELIVERY : 0

          return (
            <div key={order.id} className="card overflow-hidden">
              {/* Status bar */}
              <div className="px-4 py-2.5 flex items-center justify-between"
                   style={{ background: meta.bg, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-2">
                  {done
                    ? <RiCheckLine size={14} style={{ color: meta.color }} />
                    : <RiMotorbikeLine size={14} style={{ color: meta.color }} />}
                  <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                </div>
                <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{order.id}</span>
              </div>

              <div className="p-4 space-y-3.5">
                {/* Products */}
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {(order.items ?? []).slice(0, 3).map(({ product }, i) => (
                      <img key={i} src={product.imageUrl} alt={product.name}
                           className="w-10 h-10 rounded-lg object-cover"
                           style={{ border: '2px solid #18181c' }} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {(order.items ?? []).map(i => i.product.name).join(', ')}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{(order.items ?? []).length} {(order.items ?? []).length === 1 ? 'producto' : 'productos'}</p>
                  </div>
                </div>

                {/* Address (mock) */}
                <div className="flex items-start gap-2 rounded-xl p-3"
                     style={{ background: '#111115', border: '1px solid #27272a' }}>
                  <RiMapPinLine size={15} className="text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">Destinatario</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.address?.street}, {order.address?.city}
                      {order.address?.zip ? ` (CP ${order.address.zip})` : ''}
                    </p>
                    <button className="text-xs mt-1" style={{ color: '#f59e0b' }}
                            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(`${order.address?.street} ${order.address?.city}`)}`)}>
                      Ver en mapa →
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <RiTimeLine size={13} />
                    {new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  </div>
                  {done ? (
                    <span className="text-xs font-semibold neon-text">
                      +{formatCurrency(earned)} cobrados
                    </span>
                  ) : (
                    <button onClick={() => handleAdvance(order.id)}
                            className="btn-primary text-xs py-2 px-4 gap-1.5">
                      <RiCheckLine size={13} />
                      {meta.action}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Earnings summary */}
      <div className="card p-4 space-y-1"
           style={{ border: '1px solid rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.03)' }}>
        <p className="text-xs text-gray-500">Ganancia estimada por entrega</p>
        <p className="text-2xl font-bold neon-text">{formatCurrency(EARN_PER_DELIVERY)}</p>
        <p className="text-xs text-gray-600">Se acredita en tu Wallet al confirmar la entrega</p>
      </div>
    </div>
  )
}
