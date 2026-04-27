import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { RiArrowLeftLine, RiTruckLine, RiMapPinLine, RiMessage3Line, RiCheckLine, RiVideoLine, RiCloseLine } from 'react-icons/ri'
import toast from 'react-hot-toast'
import { useOrder, useCancelOrder } from '@/hooks/useOrders'
import { ListItemSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/utils/format'

// ─── Animated timeline step ───────────────────────────────────
function Step({ step, index, isCurrent, isLast, animate }) {
  const done = step.done

  return (
    <div className="flex gap-3">
      {/* Connector column */}
      <div className="flex flex-col items-center" style={{ width: '1rem' }}>
        {/* Circle */}
        <div className="relative flex-shrink-0 mt-0.5"
             style={{
               width: '1rem', height: '1rem',
               borderRadius: '9999px',
               background: done ? '#f59e0b' : '#27272a',
               border: done ? 'none' : '2px solid #27272a',
               transition: 'background 0.4s ease',
               transitionDelay: animate ? `${index * 120}ms` : '0ms',
               boxShadow: isCurrent ? '0 0 0 3px rgba(245,158,11,0.2)' : 'none',
               display: 'flex', alignItems: 'center', justifyContent: 'center',
             }}>
          {done && <RiCheckLine size={9} style={{ color: '#0c0c0e' }} />}
        </div>

        {/* Vertical line */}
        {!isLast && (
          <div style={{
            width: '2px', flexGrow: 1, marginTop: '4px',
            background: done ? 'rgba(245,158,11,0.35)' : '#27272a',
            minHeight: '24px',
            transition: 'background 0.4s ease',
            transitionDelay: animate ? `${index * 120}ms` : '0ms',
          }} />
        )}
      </div>

      {/* Text */}
      <div className={`flex-1 ${isLast ? '' : 'pb-5'}`}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium" style={{ color: done ? '#fff' : '#4b5563' }}>
            {step.label}
          </p>
          {isCurrent && (
            <span className="text-xs font-semibold animate-pulse" style={{ color: '#f59e0b' }}>
              ● EN CURSO
            </span>
          )}
        </div>
        {step.date && (
          <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>{step.date}</p>
        )}
      </div>
    </div>
  )
}

function getTracking(order) {
  if (order.tracking) return order.tracking
  const s = order.status
  return {
    carrier: 'Correo Argentino',
    trackingCode: null,
    steps: [
      { label: 'Pedido confirmado', done: true,                                              date: new Date(order.createdAt).toLocaleDateString('es-AR') },
      { label: 'En preparación',    done: ['pickup','shipping','delivered'].includes(s),     date: null },
      { label: 'En camino',         done: ['shipping','delivered'].includes(s),             date: null },
      { label: 'Entregado',         done: s === 'delivered',                                date: null },
    ],
  }
}

// ─── OrderDetailPage ──────────────────────────────────────────
export default function OrderDetailPage() {
  const { id }   = useParams()
  const navigate  = useNavigate()
  const { data: order, isLoading } = useOrder(id)
  const { mutate: cancelOrder, isLoading: cancelling } = useCancelOrder()
  const [animate, setAnimate] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100)
    return () => clearTimeout(t)
  }, [])

  if (isLoading || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {[...Array(4)].map((_, i) => <ListItemSkeleton key={i} />)}
      </div>
    )
  }

  const tracking   = getTracking(order)
  const doneCount  = tracking.steps.filter(s => s.done).length
  const totalSteps = tracking.steps.length
  const pct        = Math.round((doneCount / totalSteps) * 100)

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

      {/* Back */}
      <Link to="/orders" className="btn-ghost -ml-2 flex items-center gap-1.5 w-fit text-sm">
        <RiArrowLeftLine size={16} /> Mis pedidos
      </Link>

      {/* Order header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label mb-1">Número de pedido</p>
            <p className="font-bold text-lg">{order.id}</p>
            <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>
              {new Date(order.createdAt).toLocaleDateString('es-AR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <p className="text-xl font-bold neon-text flex-shrink-0">{formatCurrency(order.total)}</p>
        </div>
      </div>

      {/* Tracking card */}
      <div className="card p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Seguimiento del envío</h2>
          {tracking.trackingCode && (
            <span className="badge-gray font-mono" style={{ fontSize: '10px' }}>
              {tracking.trackingCode}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#27272a' }}>
            <div style={{
              height: '100%', borderRadius: '9999px',
              background: 'linear-gradient(90deg, #d97706, #f59e0b)',
              width: animate ? `${pct}%` : '0%',
              transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
          <div className="flex justify-between text-xs" style={{ color: '#4b5563' }}>
            <span>{doneCount} de {totalSteps} pasos</span>
            <span style={{ color: pct === 100 ? '#f59e0b' : '#4b5563', fontWeight: 600 }}>{pct}%</span>
          </div>
        </div>

        {/* Steps */}
        <div className="pt-2">
          {tracking.steps.map((step, i) => {
            const isCurrent = step.done && !tracking.steps[i + 1]?.done
            const isLast    = i === tracking.steps.length - 1
            return (
              <Step key={i} step={step} index={i}
                    isCurrent={isCurrent} isLast={isLast} animate={animate} />
            )
          })}
        </div>

        {/* Carrier */}
        <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid #27272a' }}>
          <RiTruckLine size={15} style={{ color: '#4b5563' }} />
          <span className="text-sm" style={{ color: '#6b7280' }}>{tracking.carrier}</span>
          {tracking.trackingCode && (
            <button className="ml-auto text-xs" style={{ color: '#f59e0b' }}
                    onClick={() => navigator.clipboard.writeText(tracking.trackingCode)}>
              Copiar código
            </button>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="card overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid #27272a' }}>
          <h2 className="font-semibold">
            Productos <span className="text-xs font-normal" style={{ color: '#4b5563' }}>({(order.items ?? []).length})</span>
          </h2>
        </div>
        <div>
          {(order.items ?? []).map(({ product, qty, unitPrice: price }) => (
            <div key={product.id} className="flex items-center gap-3 p-4"
                 style={{ borderBottom: '1px solid #27272a' }}>
              <img src={product.imageUrl} alt={product.name}
                   className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>Cantidad: {qty}</p>
              </div>
              <p className="text-sm font-bold flex-shrink-0">{formatCurrency(price)}</p>
            </div>
          ))}
          <div className="flex justify-between items-center p-4">
            <span className="text-sm" style={{ color: '#6b7280' }}>Total del pedido</span>
            <span className="font-bold">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Commission earned */}
      {order.earnedCommission > 0 && (
        <div className="card p-4 space-y-1"
             style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
          <p className="text-sm font-medium neon-text">Comisión ganada por tu video</p>
          <p className="font-bold neon-text" style={{ fontSize: '1.75rem' }}>
            {formatCurrency(order.earnedCommission)}
          </p>
          <p className="text-xs" style={{ color: '#4b5563' }}>Ya acreditado en tu Wallet</p>
        </div>
      )}

      {/* Review CTA — solo si fue entregado y tiene comisión activa */}
      {order.status === 'delivered' && (order.items ?? []).some(i => (i.product?.commissionPct ?? 0) > 0) && (
        <div className="card p-4 flex items-center gap-3"
             style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'rgba(245,158,11,0.1)' }}>
            <RiVideoLine size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">¿Ya lo recibiste?</p>
            <p className="text-xs text-gray-500 mt-0.5">Subí tu review y ganá comisiones por cada venta</p>
          </div>
          <Link to="/upload" className="btn-primary text-xs py-2 px-3 flex-shrink-0">
            Subir review
          </Link>
        </div>
      )}

      {/* Cancel confirmation */}
      {confirmCancel && (
        <div className="card p-4 space-y-3"
             style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)' }}>
          <p className="text-sm font-semibold text-red-400">¿Cancelar este pedido?</p>
          <p className="text-xs text-gray-500">Esta acción no se puede deshacer. El stock se restaurará.</p>
          <div className="flex gap-2">
            <button
              onClick={() => cancelOrder(order.id, {
                onSuccess: () => { toast.success('Pedido cancelado'); navigate('/orders') },
                onError: (err) => toast.error(err?.response?.data?.error ?? 'No se pudo cancelar'),
              })}
              disabled={cancelling}
              className="btn-danger flex-1 py-2.5 text-sm gap-1.5">
              {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
            </button>
            <button onClick={() => setConfirmCancel(false)}
                    className="btn-secondary flex-1 py-2.5 text-sm">
              Volver
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate('/chat')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all"
                style={{ border: '1px solid #27272a', color: '#6b7280', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.color = '#f59e0b' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = '#6b7280' }}>
          <RiMessage3Line size={15} /> Contactar soporte
        </button>
        {order.status === 'delivered' ? (
          <Link to={`/product/${order.items?.[0]?.product?.id ?? ''}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all"
                style={{ border: '1px solid #27272a', color: '#6b7280', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.color = '#f59e0b' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = '#6b7280' }}>
            <RiVideoLine size={15} /> Ver producto
          </Link>
        ) : order.status === 'processing' ? (
          <button
            onClick={() => setConfirmCancel(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all"
            style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <RiCloseLine size={15} /> Cancelar pedido
          </button>
        ) : (
          <button disabled
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl opacity-40 cursor-not-allowed"
                  style={{ border: '1px solid #27272a', color: '#6b7280' }}>
            <RiMapPinLine size={15} /> En preparación
          </button>
        )}
      </div>
    </div>
  )
}
