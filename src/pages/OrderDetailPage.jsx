import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RiArrowLeftLine, RiTruckLine, RiMapPinLine, RiMessage3Line, RiCheckLine, RiVideoLine, RiCloseLine } from 'react-icons/ri'
import toast from 'react-hot-toast'
import { useOrder, useCancelOrder } from '@/hooks/useOrders'
import { ListItemSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/utils/format'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay },
})

// ─── Tracking step ────────────────────────────────────────────
function Step({ step, index, isCurrent, isLast }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center" style={{ width: '1rem' }}>
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 + index * 0.1, duration: 0.35, ease: 'backOut' }}
          style={{
            width: '1rem', height: '1rem',
            borderRadius: '9999px',
            background: step.done ? '#f59e0b' : '#27272a',
            border: step.done ? 'none' : '2px solid #27272a',
            boxShadow: isCurrent ? '0 0 0 3px rgba(245,158,11,0.2)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: '2px',
          }}
        >
          {step.done && <RiCheckLine size={9} style={{ color: '#0c0c0e' }} />}
        </motion.div>

        {!isLast && (
          <motion.div
            initial={{ scaleY: 0, originY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.35 + index * 0.1, duration: 0.4, ease: 'easeOut' }}
            style={{
              width: '2px', flexGrow: 1, marginTop: '4px',
              background: step.done ? 'rgba(245,158,11,0.35)' : '#27272a',
              minHeight: '24px',
            }}
          />
        )}
      </div>

      <motion.div
        className={`flex-1 ${isLast ? '' : 'pb-5'}`}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 + index * 0.1, duration: 0.35 }}
      >
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium" style={{ color: step.done ? '#fff' : '#4b5563' }}>
            {step.label}
          </p>
          {isCurrent && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="text-xs font-semibold"
              style={{ color: '#f59e0b' }}
            >
              ● EN CURSO
            </motion.span>
          )}
        </div>
        {step.date && (
          <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>{step.date}</p>
        )}
      </motion.div>
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
      { label: 'Pedido confirmado', done: true,                                           date: new Date(order.createdAt).toLocaleDateString('es-AR') },
      { label: 'En preparación',    done: ['pickup', 'shipping', 'delivered'].includes(s), date: null },
      { label: 'En camino',         done: ['shipping', 'delivered'].includes(s),           date: null },
      { label: 'Entregado',         done: s === 'delivered',                               date: null },
    ],
  }
}

// ─── OrderDetailPage ──────────────────────────────────────────
export default function OrderDetailPage() {
  const { id }    = useParams()
  const navigate   = useNavigate()
  const { data: order, isLoading } = useOrder(id)
  const { mutate: cancelOrder, isLoading: cancelling } = useCancelOrder()
  const [confirmCancel, setConfirmCancel] = useState(false)

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
      <motion.div {...fadeUp(0)}>
        <Link to="/orders" className="btn-ghost -ml-2 flex items-center gap-1.5 w-fit text-sm">
          <RiArrowLeftLine size={16} /> Mis pedidos
        </Link>
      </motion.div>

      {/* Order header */}
      <motion.div {...fadeUp(0.05)} className="card p-5">
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
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4, ease: 'backOut' }}
            className="text-xl font-bold neon-text flex-shrink-0"
          >
            {formatCurrency(order.total)}
          </motion.p>
        </div>
      </motion.div>

      {/* Tracking card */}
      <motion.div {...fadeUp(0.1)} className="card p-5 space-y-4">
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
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{
                height: '100%',
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, #d97706, #f59e0b)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs" style={{ color: '#4b5563' }}>
            <span>{doneCount} de {totalSteps} pasos</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ color: pct === 100 ? '#f59e0b' : '#4b5563', fontWeight: 600 }}
            >
              {pct}%
            </motion.span>
          </div>
        </div>

        {/* Steps */}
        <div className="pt-2">
          {tracking.steps.map((step, i) => {
            const isCurrent = step.done && !tracking.steps[i + 1]?.done
            const isLast    = i === tracking.steps.length - 1
            return (
              <Step key={i} step={step} index={i} isCurrent={isCurrent} isLast={isLast} />
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
      </motion.div>

      {/* Products */}
      <motion.div {...fadeUp(0.15)} className="card overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid #27272a' }}>
          <h2 className="font-semibold">
            Productos <span className="text-xs font-normal" style={{ color: '#4b5563' }}>({(order.items ?? []).length})</span>
          </h2>
        </div>
        <div>
          {(order.items ?? []).map(({ product, qty, unitPrice: price }, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.35 }}
              className="flex items-center gap-3 p-4"
              style={{ borderBottom: '1px solid #27272a' }}
            >
              <img src={product.imageUrl} alt={product.name}
                   className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>Cantidad: {qty}</p>
              </div>
              <p className="text-sm font-bold flex-shrink-0">{formatCurrency(price)}</p>
            </motion.div>
          ))}
          <div className="flex justify-between items-center p-4">
            <span className="text-sm" style={{ color: '#6b7280' }}>Total del pedido</span>
            <span className="font-bold">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </motion.div>

      {/* Commission earned */}
      <AnimatePresence>
        {order.earnedCommission > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.45, ease: 'backOut' }}
            className="card p-4 space-y-1"
            style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}
          >
            <p className="text-sm font-medium neon-text">Comisión ganada por tu video</p>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.35 }}
              className="font-bold neon-text"
              style={{ fontSize: '1.75rem' }}
            >
              {formatCurrency(order.earnedCommission)}
            </motion.p>
            <p className="text-xs" style={{ color: '#4b5563' }}>Ya acreditado en tu Wallet</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review CTA */}
      <AnimatePresence>
        {order.status === 'delivered' && (order.items ?? []).some(i => (i.product?.commissionPct ?? 0) > 0) && (
          <motion.div
            {...fadeUp(0.3)}
            className="card p-4 flex items-center gap-3"
            style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel confirmation */}
      <AnimatePresence>
        {confirmCancel && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="card p-4 space-y-3 overflow-hidden"
            style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)' }}
          >
            <p className="text-sm font-semibold text-red-400">¿Cancelar este pedido?</p>
            <p className="text-xs text-gray-500">Esta acción no se puede deshacer. El stock se restaurará.</p>
            <div className="flex gap-2">
              <button
                onClick={() => cancelOrder(order.id, {
                  onSuccess: () => { toast.success('Pedido cancelado'); navigate('/orders') },
                  onError: (err) => toast.error(err?.response?.data?.error ?? 'No se pudo cancelar'),
                })}
                disabled={cancelling}
                className="btn-danger flex-1 py-2.5 text-sm gap-1.5"
              >
                {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
              <button onClick={() => setConfirmCancel(false)}
                      className="btn-secondary flex-1 py-2.5 text-sm">
                Volver
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <motion.div {...fadeUp(0.35)} className="flex gap-3">
        <button onClick={() => navigate('/chat')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-colors"
                style={{ border: '1px solid #27272a', color: '#6b7280', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.color = '#f59e0b' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = '#6b7280' }}>
          <RiMessage3Line size={15} /> Contactar soporte
        </button>
        {order.status === 'delivered' ? (
          <Link to={`/product/${order.items?.[0]?.product?.id ?? ''}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-colors"
                style={{ border: '1px solid #27272a', color: '#6b7280', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.color = '#f59e0b' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = '#6b7280' }}>
            <RiVideoLine size={15} /> Ver producto
          </Link>
        ) : order.status === 'processing' ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setConfirmCancel(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <RiCloseLine size={15} /> Cancelar pedido
          </motion.button>
        ) : (
          <button disabled
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl opacity-40 cursor-not-allowed"
                  style={{ border: '1px solid #27272a', color: '#6b7280' }}>
            <RiMapPinLine size={15} /> En preparación
          </button>
        )}
      </motion.div>
    </div>
  )
}
