import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiCloseLine, RiHeartLine, RiHeartFill,
  RiShareForwardLine, RiShoppingBag3Line,
  RiUserFollowLine, RiCheckLine,
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import Avatar from '@/components/ui/Avatar'
import { formatNumber, formatCurrency, timeAgo } from '@/utils/format'
import { useSocialStore } from '@/store/socialStore'
import { useAuthStore } from '@/store/authStore'
import { videosApi } from '@/services/api'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'

export default function VideoModal({ video, onClose }) {
  const videoRef = useRef(null)
  const { user, isAuthenticated } = useAuthStore()
  const { isLiked, toggleLike, isFollowing, toggleFollow } = useSocialStore()
  const addItem  = useCartStore(s => s.addItem)
  const openCart = useUIStore(s => s.openCart)

  const liked     = isLiked(video.id)
  const following = isFollowing(video.creator.username)
  const isOwn     = user?.username === video.creator.username

  useEffect(() => {
    videoRef.current?.play?.().catch(() => {})
    videosApi.view(video.id).catch(() => {})
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [video.id])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleLike = () => {
    if (!isAuthenticated) { toast.error('Iniciá sesión para dar like'); return }
    toggleLike(video.id)
  }

  const handleFollow = () => {
    if (!isAuthenticated || isOwn) return
    toggleFollow(video.creator.username)
    toast.success(following ? `Dejaste de seguir a @${video.creator.username}` : `Seguís a @${video.creator.username}`)
  }

  const handleShare = async () => {
    const url = video.product?.id
      ? `${window.location.origin}/product/${video.product.id}?ref=${video.id}`
      : window.location.href
    try {
      if (navigator.share) await navigator.share({ title: video.title, url })
      else { await navigator.clipboard.writeText(url); toast.success('Link copiado') }
    } catch { /* cancelled */ }
  }

  const handleBuy = () => {
    if (!video.product) return
    addItem(video.product, video.id)
    toast.success(`${video.product.name} agregado al carrito`)
    openCart()
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col md:flex-row"
          style={{ maxHeight: '92vh', background: '#111115', border: '1px solid #27272a' }}>

          {/* Close */}
          <button onClick={onClose}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
            <RiCloseLine size={18} />
          </button>

          {/* Video side */}
          <div className="relative bg-black flex-shrink-0 flex items-center justify-center"
               style={{ width: '100%', maxWidth: '340px', aspectRatio: '9/16' }}>
            {video.videoUrl ? (
              <video
                ref={videoRef}
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                loop muted playsInline controls
                className="w-full h-full object-cover"
              />
            ) : (
              <img src={video.thumbnailUrl} alt={video.title}
                   className="w-full h-full object-cover" />
            )}
          </div>

          {/* Info side */}
          <div className="flex-1 flex flex-col overflow-y-auto p-5 space-y-4 min-w-0">

            {/* Creator */}
            <div className="flex items-center gap-3">
              <Link to={`/profile/${video.creator.username}`} onClick={onClose}>
                <Avatar src={video.creator.avatar} name={video.creator.name} size="md" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${video.creator.username}`} onClick={onClose}
                      className="font-semibold text-sm hover:text-brand-neon transition-colors">
                  {video.creator.name}
                </Link>
                <p className="text-xs text-gray-500">@{video.creator.username}</p>
              </div>
              {!isOwn && (
                <button onClick={handleFollow}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                          following ? 'btn-secondary' : 'btn-primary'
                        }`}>
                  {following ? <RiCheckLine size={13} /> : <RiUserFollowLine size={13} />}
                  {following ? 'Siguiendo' : 'Seguir'}
                </button>
              )}
            </div>

            {/* Title */}
            <div>
              <p className="font-semibold leading-snug">{video.title}</p>
              {video.createdAt && (
                <p className="text-xs text-gray-600 mt-1">{timeAgo(video.createdAt)}</p>
              )}
            </div>

            {/* Tags */}
            {video.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {video.tags.map(t => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: '#1c1c1f', color: '#71717a', border: '1px solid #27272a' }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button onClick={handleLike}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                        liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
                      }`}>
                {liked ? <RiHeartFill size={20} /> : <RiHeartLine size={20} />}
                {formatNumber((video.likes ?? 0) + (liked ? 1 : 0))}
              </button>
              <button onClick={handleShare}
                      className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-neon transition-colors">
                <RiShareForwardLine size={20} /> Compartir
              </button>
            </div>

            {/* Product card */}
            {video.product && (
              <div className="rounded-2xl p-4 space-y-3"
                   style={{ background: '#18181c', border: '1px solid #27272a' }}>
                <div className="flex items-center gap-3">
                  <img src={video.product.imageUrl} alt={video.product.name}
                       className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">{video.product.category}</p>
                    <p className="font-semibold text-sm truncate">{video.product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold" style={{ color: '#f59e0b' }}>
                        {formatCurrency(video.product.price)}
                      </span>
                      {video.commissionPct > 0 && (
                        <span className="badge-neon" style={{ fontSize: '10px' }}>
                          +{video.commissionPct}% comisión
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={handleBuy} className="btn-primary w-full py-3 gap-2">
                  <RiShoppingBag3Line size={17} /> Agregar al carrito
                </button>
                <Link to={`/product/${video.product.id}?ref=${video.id}`}
                      onClick={onClose}
                      className="block text-center text-xs py-1"
                      style={{ color: '#71717a' }}>
                  Ver página del producto →
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
