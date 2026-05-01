import { useState } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  RiStarFill, RiShoppingBag3Line, RiVideoLine, RiShareForwardLine,
  RiArrowLeftLine, RiCheckLine, RiStoreLine, RiArrowRightLine,
  RiHeartLine, RiHeartFill, RiFlashlightLine, RiMessage3Line, RiFlashlightFill,
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import VideoCard from '@/components/video/VideoCard'
import ProductCard from '@/components/product/ProductCard'
import BorderBeam from '@/components/ui/BorderBeam'
import Avatar from '@/components/ui/Avatar'
import { useProduct, useProducts } from '@/hooks/useProducts'
import { useProductVideos } from '@/hooks/useVideos'
import { useReviews, useCreateReview } from '@/hooks/useReviews'
import { formatCurrency, formatNumber } from '@/utils/format'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useWishlistStore } from '@/store/wishlistStore'
import StarRating from '@/components/ui/StarRating'
import { useQuery } from 'react-query'
import { ordersApi } from '@/services/api'
import SEO from '@/components/ui/SEO'

export default function ProductPage() {
  const { id }           = useParams()
  const [searchParams]   = useSearchParams()
  const navigate         = useNavigate()
  const referrerId       = searchParams.get('ref')
  const { data: product, isLoading } = useProduct(id)
  const { data: videos = [] }        = useProductVideos(id)
  const { data: relatedData }        = useProducts(product ? { category: product.category, limit: 7 } : {})
  const [qty, setQty]         = useState(1)
  const [shared, setShared]   = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewBody, setReviewBody]     = useState('')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const addItem          = useCartStore(s => s.addItem)
  const openCart         = useUIStore(s => s.openCart)
  const { user }         = useAuthStore()
  const { toggle: toggleWishlist, isWishlisted } = useWishlistStore()
  const wishlisted       = product ? isWishlisted(product.id) : false
  const { data: reviews = [] }               = useReviews(id)
  const { mutate: submitReview, isLoading: submittingReview } = useCreateReview(id)
  const { data: orders = [] } = useQuery(
    ['orders'],
    () => ordersApi.getAll(),
    { enabled: !!user, staleTime: 60_000 },
  )
  const deliveredOrder = orders.find(o => o.status === 'delivered' && o.items?.some(i => i.productId === id || i.product?.id === id))
  const alreadyReviewed  = reviews.some(r => r.userId === user?.id)

  if (isLoading || !product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-8 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  const relatedProducts = (relatedData?.pages?.flatMap(p => p.data ?? p) ?? [])
    .filter(p => p.id !== product.id)
    .slice(0, 6)

  const myVideo = user ? videos.find(v => v.creator?.id === user.id || v.creator?.username === user.username) : null

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addItem(product, referrerId ?? null)
    toast.success(`${product.name} agregado al carrito`)
    openCart()
  }

  const handleBuyNow = () => {
    for (let i = 0; i < qty; i++) addItem(product, referrerId ?? null)
    navigate('/checkout')
  }

  const handleShare = async () => {
    const ref = myVideo?.id ?? referrerId
    const url = ref
      ? `${window.location.origin}/product/${product.id}?ref=${ref}`
      : `${window.location.origin}/product/${product.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copiado al portapapeles')
      }
    } catch {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado al portapapeles')
    }
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  return (
    <motion.div
      className="max-w-5xl mx-auto px-4 py-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}
    >
      <SEO
        title={product.name}
        description={product.description?.slice(0, 160)}
        image={product.imageUrl}
        url={`https://cannapont.vercel.app/product/${product.id}`}
        type="product"
      />
      {/* Back */}
      <Link to="/market" className="btn-ghost -ml-2 flex items-center gap-1.5 w-fit text-sm mb-6">
        <RiArrowLeftLine size={16} /> Marketplace
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-14">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-surface">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          {discount && (
            <div className="absolute top-3 left-3">
              <span className="badge-red text-sm">-{discount}% OFF</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <p className="label mb-1">{product.category}</p>
            <h1 className="text-2xl font-bold leading-snug">{product.name}</h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <RiStarFill key={i} size={15}
                  className={i < Math.round(product.rating) ? 'text-amber-400' : 'text-gray-800'} />
              ))}
            </div>
            <span className="text-sm text-gray-500">{product.rating} · {formatNumber(product.reviewCount)} opiniones</span>
            <span className="text-gray-800">·</span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <RiVideoLine size={12} /> {product.videoCount} videos
            </span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold">{formatCurrency(product.price)}</p>
            {product.originalPrice && (
              <p className="text-gray-600 line-through text-lg">{formatCurrency(product.originalPrice)}</p>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>

          {/* Commission info */}
          {product.commissionPct && (
            <motion.div
              className="relative rounded-2xl p-4 overflow-hidden"
              style={{
                background: 'linear-gradient(var(--cp-card), var(--cp-card)) padding-box, linear-gradient(135deg, rgba(245,158,11,0.28) 0%, transparent 55%) border-box',
                border: '1px solid transparent',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <BorderBeam colorFrom="#f59e0b" colorTo="#a78bfa" duration={10} />
              <div className="relative space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <RiFlashlightLine size={14} style={{ color: '#f59e0b' }} />
                  </div>
                  <p className="text-sm font-bold neon-text">Ganás comprando este producto</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>
                  Subí tu review en video y ganá el{' '}
                  <span className="font-semibold" style={{ color: '#fafafa' }}>{product.commissionPct}%</span>{' '}
                  de cada venta que genere. Sin límite de ganancias.
                </p>
                <div className="flex items-center gap-2.5 pt-0.5">
                  <span className="badge-neon">+{product.commissionPct}%</span>
                  <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>
                    = {formatCurrency(product.price * product.commissionPct / 100)} por venta
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Qty + CTA */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-brand-border rounded-xl p-1">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 transition-colors">
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button onClick={() => setQty(q => q + 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 transition-colors">
                  +
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Subtotal: <span className="text-white font-semibold">{formatCurrency(product.price * qty)}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={handleAddToCart} className="btn-secondary flex-1 py-4 text-base gap-2">
                <RiShoppingBag3Line size={18} />
                Agregar al carrito
              </button>
              <button onClick={handleBuyNow} className="btn-primary flex-1 py-4 text-base gap-2">
                <RiFlashlightFill size={18} />
                Comprar ahora
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleShare} className="btn-secondary flex-1 py-3 gap-2">
                {shared ? <RiCheckLine size={16} /> : <RiShareForwardLine size={16} />}
                {shared ? 'Link copiado!' : (myVideo && product.commissionPct) ? `Compartir +${product.commissionPct}%` : 'Compartir'}
              </button>
              <button
                onClick={() => { const added = toggleWishlist(product); toast(added ? 'Guardado en favoritos' : 'Eliminado de favoritos', { icon: added ? '♥' : '🗑', duration: 1800 }) }}
                className="btn-secondary py-3 px-4 gap-1.5"
                title={wishlisted ? 'Quitar de favoritos' : 'Guardar en favoritos'}>
                {wishlisted
                  ? <RiHeartFill size={18} className="text-red-400" />
                  : <RiHeartLine size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seller info */}
      {product.seller && (
        <div className="card p-4 flex items-center gap-4">
          <Link to={`/profile/${product.seller.username}`}>
            <Avatar src={product.seller.avatar} name={product.seller.name} size="lg" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="label mb-0.5">Vendedor</p>
            <Link to={`/profile/${product.seller.username}`}
                  className="font-semibold text-sm hover:text-brand-neon transition-colors">
              {product.seller.name}
            </Link>
            <p className="text-xs text-gray-500">@{product.seller.username}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {user && user.id !== product.seller.id && (
              <Link to={`/chat?with=${product.seller.id}`}
                    className="btn-icon w-9 h-9"
                    title="Enviar mensaje">
                <RiMessage3Line size={16} />
              </Link>
            )}
            <Link to={`/profile/${product.seller.username}`}
                  className="btn-icon w-9 h-9">
              <RiArrowRightLine size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Stock indicator */}
      {product.stock !== undefined && (
        <div className="flex items-center gap-2 text-xs"
             style={{ color: product.stock <= 5 ? '#f87171' : product.stock <= 20 ? '#fbbf24' : '#6b7280' }}>
          <RiStoreLine size={13} />
          {product.stock === 0
            ? 'Sin stock'
            : product.stock <= 5
            ? `¡Solo quedan ${product.stock}!`
            : product.stock <= 20
            ? `Stock limitado (${product.stock} disponibles)`
            : `${product.stock} disponibles`}
        </div>
      )}

      {/* ── Reseñas con rating ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="label mb-1">Comunidad</p>
            <h2 className="section-title">Opiniones <span className="neon-text">verificadas</span></h2>
          </div>
          {user && deliveredOrder && !alreadyReviewed && (
            <button onClick={() => setShowReviewForm(f => !f)} className="btn-secondary text-sm gap-2">
              <RiStarFill size={14} /> Dejar reseña
            </button>
          )}
        </div>

        {/* Formulario */}
        {showReviewForm && (
          <div className="card p-5 mb-4 space-y-4" style={{ border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="font-semibold text-sm">Tu calificación</p>
            <StarRating value={reviewRating} onChange={setReviewRating} size={28} />
            <textarea value={reviewBody} onChange={e => setReviewBody(e.target.value)}
                      placeholder="Contá tu experiencia con el producto (opcional)..."
                      className="input resize-none w-full" rows={3} />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!reviewRating) return toast.error('Seleccioná una calificación')
                  submitReview({ rating: reviewRating, body: reviewBody || undefined, orderId: deliveredOrder.id },
                    { onSuccess: () => { setShowReviewForm(false); setReviewRating(0); setReviewBody('') } })
                }}
                disabled={!reviewRating || submittingReview}
                className="btn-primary text-sm px-4">
                {submittingReview ? 'Publicando...' : 'Publicar reseña'}
              </button>
              <button onClick={() => setShowReviewForm(false)} className="btn-ghost text-sm">Cancelar</button>
            </div>
          </div>
        )}

        {/* Lista de reseñas */}
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-600 py-4">Todavía no hay reseñas. ¡Sé el primero!</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="card p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar src={r.user.avatar} name={r.user.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{r.user.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <StarRating value={r.rating} readonly size={14} />
                </div>
                {r.body && <p className="text-sm text-gray-400 pl-9">{r.body}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video reviews */}
      {videos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="label mb-1">Comunidad</p>
              <h2 className="section-title">Reviews en <span className="neon-text">video</span></h2>
            </div>
            <span className="badge-gray">{formatNumber(product.videoCount)} videos</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {videos.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        </div>
      )}

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="label mb-1">{product.category}</p>
              <h2 className="section-title">Productos <span className="neon-text">relacionados</span></h2>
            </div>
            <Link to={`/market?category=${product.category}`}
                  className="btn-ghost text-xs flex items-center gap-1">
              Ver más <RiArrowRightLine size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Mobile sticky CTA */}
      <div
        className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-4 py-3"
        style={{ background: 'rgba(11,11,13,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <button onClick={handleAddToCart} className="btn-primary w-full py-3.5 gap-2 text-sm shadow-neon">
          <RiShoppingBag3Line size={16} />
          Agregar al carrito · {formatCurrency(product.price * qty)}
        </button>
      </div>

    </motion.div>
  )
}
