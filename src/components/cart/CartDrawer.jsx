import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiCloseLine, RiShoppingBag3Line, RiDeleteBinLine,
  RiAddLine, RiSubtractLine, RiArrowRightLine,
} from 'react-icons/ri'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import { formatCurrency } from '@/utils/format'

export default function CartDrawer() {
  const { items, removeItem, updateQty, clearCart, referrerId } = useCartStore()
  const total    = items.reduce((acc, i) => acc + i.product.price * i.qty, 0)
  const count    = items.reduce((acc, i) => acc + i.qty, 0)
  const cartOpen = useUIStore(s => s.cartOpen)
  const closeCart = useUIStore(s => s.closeCart)

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (cartOpen) document.body.style.overflow = 'hidden'
    else          document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [cartOpen])

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeCart() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeCart])

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full z-50 flex flex-col"
            style={{
              width: 'min(420px, 100vw)',
              background: '#111115',
              borderLeft: '1px solid #27272a',
              boxShadow: '-8px 0 48px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4"
                 style={{ borderBottom: '1px solid #27272a' }}>
              <div className="flex items-center gap-2.5">
                <RiShoppingBag3Line size={20} style={{ color: '#f59e0b' }} />
                <h2 className="font-bold text-lg">Carrito</h2>
                {count > 0 && (
                  <span className="w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center text-brand-dark"
                        style={{ background: '#f59e0b' }}>
                    {count}
                  </span>
                )}
              </div>
              <button onClick={closeCart} className="btn-icon w-8 h-8">
                <RiCloseLine size={18} />
              </button>
            </div>

            {/* Content */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 text-center">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                     style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.1)' }}>
                  <RiShoppingBag3Line size={36} style={{ color: 'rgba(245,158,11,0.3)' }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-300">Tu carrito está vacío</p>
                  <p className="text-sm text-gray-600 mt-1">Explorá el marketplace y agregá productos</p>
                </div>
                <Link to="/market" onClick={closeCart} className="btn-primary mt-2 gap-2">
                  Ir al marketplace <RiArrowRightLine size={16} />
                </Link>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="flex-1 overflow-y-auto py-2">
                  <AnimatePresence initial={false}>
                    {items.map(({ product, qty }) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-3 px-5 py-3.5"
                             style={{ borderBottom: '1px solid #1f1f23' }}>
                          {/* Imagen */}
                          <Link to={`/product/${product.id}`} onClick={closeCart}
                                className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-brand-card">
                            <img src={product.imageUrl} alt={product.name}
                                 className="w-full h-full object-cover" />
                          </Link>

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <Link to={`/product/${product.id}`} onClick={closeCart}>
                              <p className="text-sm font-medium leading-snug line-clamp-2 hover:text-brand-neon transition-colors">
                                {product.name}
                              </p>
                            </Link>
                            {referrerId && product.commissionPct > 0 && (
                              <span className="badge-neon" style={{ fontSize: '9px' }}>
                                +{product.commissionPct}% comisión activa
                              </span>
                            )}
                            <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>
                              {formatCurrency(product.price * qty)}
                            </p>
                          </div>

                          {/* Qty + delete */}
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <button onClick={() => removeItem(product.id)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                    style={{ color: '#4b5563' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
                              <RiDeleteBinLine size={15} />
                            </button>

                            <div className="flex items-center gap-1 rounded-lg overflow-hidden"
                                 style={{ border: '1px solid #27272a' }}>
                              <button onClick={() => updateQty(product.id, qty - 1)}
                                      className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-colors">
                                <RiSubtractLine size={12} />
                              </button>
                              <span className="w-7 text-center text-sm font-semibold">{qty}</span>
                              <button onClick={() => updateQty(product.id, qty + 1)}
                                      className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-colors">
                                <RiAddLine size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-5 py-5 space-y-4" style={{ borderTop: '1px solid #27272a' }}>
                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Total ({count} {count === 1 ? 'producto' : 'productos'})</span>
                    <span className="text-xl font-bold">{formatCurrency(total)}</span>
                  </div>

                  {/* CTA */}
                  <Link to="/checkout" onClick={closeCart} className="btn-primary w-full py-3.5 text-base gap-2 shadow-neon">
                    Ir al checkout <RiArrowRightLine size={18} />
                  </Link>

                  <button onClick={clearCart}
                          className="w-full text-xs text-center transition-colors py-1"
                          style={{ color: '#4b5563' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                          onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
                    Vaciar carrito
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
