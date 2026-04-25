import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { RiHeartLine, RiShoppingBag3Line, RiDeleteBin2Line, RiArrowRightLine } from 'react-icons/ri'
import toast from 'react-hot-toast'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import { formatCurrency } from '@/utils/format'

export default function WishlistPage() {
  const { items, remove, clear } = useWishlistStore()
  const addItem  = useCartStore(s => s.addItem)
  const openCart = useUIStore(s => s.openCart)

  const handleAddToCart = (product) => {
    addItem(product)
    toast.success(`${product.name} agregado al carrito`)
    openCart()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="label mb-1">Lista personal</p>
          <h1 className="section-title" style={{ fontSize: '1.75rem' }}>
            Mis <span className="neon-text">favoritos</span>
          </h1>
        </div>
        {items.length > 0 && (
          <button onClick={() => { clear(); toast('Lista vacía', { icon: '🗑' }) }}
                  className="btn-ghost text-xs flex items-center gap-1.5">
            <RiDeleteBin2Line size={13} /> Limpiar todo
          </button>
        )}
      </div>

      {/* Empty */}
      {items.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
               style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
            <RiHeartLine size={28} style={{ color: 'rgba(239,68,68,0.4)' }} />
          </div>
          <div>
            <p className="font-semibold text-gray-400">No guardaste ningún producto</p>
            <p className="text-sm text-gray-600 mt-1">
              Tocá el ♥ en cualquier producto para guardarlo acá
            </p>
          </div>
          <Link to="/market" className="btn-primary inline-flex gap-2 text-sm py-2.5 px-6">
            <RiShoppingBag3Line size={15} /> Explorar marketplace
          </Link>
        </div>
      )}

      {/* List */}
      <AnimatePresence initial={false}>
        {items.map(product => {
          const discount = product.originalPrice
            ? Math.round((1 - product.price / product.originalPrice) * 100) : null

          return (
            <motion.div key={product.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16,1,0.3,1] }}>
              <div className="card flex items-center gap-4 p-4">
                <Link to={`/product/${product.id}`} className="flex-shrink-0">
                  <img src={product.imageUrl} alt={product.name}
                       className="w-20 h-20 rounded-xl object-cover" />
                </Link>

                <div className="flex-1 min-w-0 space-y-1">
                  <p className="label truncate">{product.category}</p>
                  <Link to={`/product/${product.id}`}
                        className="font-semibold text-sm line-clamp-2 leading-snug hover:text-brand-neon transition-colors">
                    {product.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-bold text-white">{formatCurrency(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-700 line-through">{formatCurrency(product.originalPrice)}</span>
                    )}
                    {discount && <span className="badge-red text-[10px]">-{discount}%</span>}
                    {product.commissionPct > 0 && (
                      <span className="badge-neon text-[10px]">+{product.commissionPct}%</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => handleAddToCart(product)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
                          title="Agregar al carrito">
                    <RiShoppingBag3Line size={16} style={{ color: '#0c0c0e' }} />
                  </button>
                  <button onClick={() => { remove(product.id); toast('Eliminado de favoritos', { icon: '🗑', duration: 1500 }) }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                          style={{ border: '1px solid #27272a' }}
                          title="Quitar de favoritos">
                    <RiDeleteBin2Line size={15} className="text-gray-600 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Footer CTA */}
      {items.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">{items.length} producto{items.length !== 1 ? 's' : ''} guardados</p>
          <Link to="/market" className="btn-ghost text-xs flex items-center gap-1">
            Seguir viendo <RiArrowRightLine size={12} />
          </Link>
        </div>
      )}
    </div>
  )
}
