import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  RiPlayFill, RiHeartLine, RiHeartFill,
  RiShareForwardLine, RiShoppingBag3Line, RiDeleteBin2Line,
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import Avatar from '@/components/ui/Avatar'
import VideoModal from './VideoModal'
import { formatNumber, formatCurrency, timeAgo } from '@/utils/format'
import { useSocialStore } from '@/store/socialStore'
import { useAuthStore } from '@/store/authStore'
import clsx from 'clsx'

export default function VideoCard({ video, compact = false, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false)

  const { id, thumbnailUrl, videoUrl, title, creator, product, likes, views, commissionPct, createdAt } = video

  const { isAuthenticated } = useAuthStore()
  const { isLiked, toggleLike } = useSocialStore()
  const liked = isLiked(id)

  const handleLike = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) { toast.error('Iniciá sesión para dar like'); return }
    toggleLike(id)
  }

  const handleShare = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const url = product?.id
      ? `${window.location.origin}/product/${product.id}?ref=${id}`
      : window.location.href
    try {
      if (navigator.share) await navigator.share({ title, url })
      else { await navigator.clipboard.writeText(url); toast.success('Link copiado') }
    } catch { /* user cancelled */ }
  }

  return (
    <>
      <article className={clsx('card-hover flex flex-col group animate-scale-in cursor-pointer', compact && 'text-xs')}
               onClick={() => setModalOpen(true)}>
        {/* Media */}
        <div className="relative aspect-[9/16] bg-brand-surface overflow-hidden rounded-t-2xl">
          {videoUrl
            ? <video src={videoUrl} poster={thumbnailUrl}
                     className="w-full h-full object-cover" loop muted playsInline />
            : <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover
                   group-hover:scale-[1.03] transition-transform duration-500" />
          }

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center
                            bg-white/15 backdrop-blur-sm opacity-0 group-hover:opacity-100
                            transition-all duration-200 group-hover:scale-100 scale-90">
              <RiPlayFill size={22} className="text-white ml-0.5" />
            </div>
          </div>

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(id) }}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center
                         opacity-0 group-hover:opacity-100 transition-opacity z-10"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
              <RiDeleteBin2Line size={14} className="text-red-400" />
            </button>
          )}

          {/* Commission badge */}
          {commissionPct && (
            <div className="absolute top-2.5 left-2.5">
              <span className="badge-neon text-[10px]">+{commissionPct}% comisión</span>
            </div>
          )}

          {/* Views */}
          <div className="absolute bottom-2.5 right-2.5 text-[10px] text-white/70 font-medium
                          bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
            {formatNumber(views)} vistas
          </div>
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-2.5 flex-1">
          {/* Creator row */}
          <div className="flex items-center gap-2">
            <Link to={`/profile/${creator.username}`} onClick={e => e.stopPropagation()}>
              <Avatar src={creator.avatar} name={creator.name} size="xs" />
            </Link>
            <Link to={`/profile/${creator.username}`}
                  onClick={e => e.stopPropagation()}
                  className="text-xs font-medium text-gray-400 hover:text-brand-neon transition-colors truncate">
              @{creator.username}
            </Link>
            {createdAt && <span className="text-[10px] text-gray-700 ml-auto flex-shrink-0">{timeAgo(createdAt)}</span>}
          </div>

          {/* Title */}
          <p className="text-sm text-gray-200 line-clamp-2 leading-snug font-medium">{title}</p>

          {/* Product chip */}
          {product && (
            <Link to={`/product/${product.id}?ref=${id}`}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-2 p-2 rounded-xl border border-brand-border
                             hover:border-brand-neon/30 hover:bg-brand-neon/5 transition-all duration-200 group/p">
              <img src={product.imageUrl} alt={product.name}
                   className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-500 truncate">{product.name}</p>
                <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>{formatCurrency(product.price)}</p>
              </div>
              <RiShoppingBag3Line size={15} className="text-gray-600 group-hover/p:text-brand-neon transition-colors flex-shrink-0" />
            </Link>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-0.5">
            <button onClick={handleLike}
                    className={clsx('flex items-center gap-1 text-xs transition-colors',
                      liked ? 'text-red-400' : 'text-gray-600 hover:text-red-400')}>
              {liked ? <RiHeartFill size={16} /> : <RiHeartLine size={16} />}
              <span>{formatNumber(likes + (liked ? 1 : 0))}</span>
            </button>
            <button onClick={handleShare}
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand-neon transition-colors ml-auto">
              <RiShareForwardLine size={16} />
              <span>Compartir</span>
            </button>
          </div>
        </div>
      </article>

      {modalOpen && (
        <VideoModal video={video} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
