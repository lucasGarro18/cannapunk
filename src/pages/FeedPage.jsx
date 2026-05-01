import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  RiHeartLine, RiHeartFill, RiShareForwardLine,
  RiShoppingBag3Line, RiVolumeUpLine, RiVolumeMuteLine,
  RiPlayLine, RiPauseLine, RiFlashlightLine,
} from 'react-icons/ri'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Avatar from '@/components/ui/Avatar'
import { formatNumber, formatCurrency } from '@/utils/format'
import { useSocialStore } from '@/store/socialStore'
import { useAuthStore } from '@/store/authStore'
import { useVideosStore } from '@/store/videosStore'
import { useFeedVideos } from '@/hooks/useVideos'
import { videosApi } from '@/services/api'

const CATEGORIES = ['Para ti', 'Siguiendo', 'Electronica', 'Indumentaria', 'Calzado', 'Accesorios']

// ─── VideoItem ────────────────────────────────────────────────
function VideoItem({ video, isActive }) {
  const [muted,          setMuted]          = useState(true)
  const [playing,        setPlaying]        = useState(false)
  const [showPause,      setShowPause]      = useState(false)
  const [doubleTapHeart, setDoubleTapHeart] = useState(false)
  const videoRef   = useRef(null)
  const lastTap    = useRef(0)
  const pauseTimer = useRef(null)
  const { title, creator, product, likes, commissionPct, thumbnailUrl, videoUrl } = video

  const { isAuthenticated, user } = useAuthStore()
  const { isLiked, toggleLike, isFollowing, toggleFollow } = useSocialStore()
  const liked     = isLiked(video.id)
  const following = isFollowing(creator.username)
  const isOwn     = user?.username === creator.username

  useEffect(() => {
    if (!videoRef.current) return
    if (isActive) {
      videoRef.current.play?.().catch(() => {})
      setPlaying(true)
      videosApi.view(video.id).catch(() => {})
    } else {
      videoRef.current.pause?.()
      setPlaying(false)
    }
  }, [isActive])

  const handleLike = () => {
    if (!isAuthenticated) { toast.error('Iniciá sesión para dar like'); return }
    toggleLike(video.id)
  }

  const handleFollow = (e) => {
    e.stopPropagation()
    if (!isAuthenticated) { toast.error('Iniciá sesión para seguir'); return }
    if (isOwn) return
    toggleFollow(creator.username)
    toast.success(following ? `Dejaste de seguir a @${creator.username}` : `Seguís a @${creator.username}`)
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    const url = product?.id
      ? `${window.location.origin}/product/${product.id}?ref=${video.id}`
      : `${window.location.origin}/feed`
    try {
      if (navigator.share) await navigator.share({ title, url })
      else { await navigator.clipboard.writeText(url); toast.success('Link copiado') }
    } catch { /* user cancelled */ }
  }

  const handleVideoTap = (e) => {
    // No interceptar clicks en el card de producto ni en sus hijos
    if (e.target.closest('[data-card]')) return
    if (e.target.closest('a') || e.target.closest('button')) return
    const now = Date.now()
    if (now - lastTap.current < 300) {
      lastTap.current = 0
      clearTimeout(pauseTimer.current)
      if (isAuthenticated) {
        if (!liked) toggleLike(video.id)
        setDoubleTapHeart(true)
        setTimeout(() => setDoubleTapHeart(false), 900)
      }
    } else {
      lastTap.current = now
      pauseTimer.current = setTimeout(() => {
        if (!videoRef.current) return
        if (playing) { videoRef.current.pause(); setPlaying(false) }
        else { videoRef.current.play?.().catch(() => {}); setPlaying(true) }
        setShowPause(true)
        setTimeout(() => setShowPause(false), 800)
      }, 300)
    }
  }

  return (
    <div className="relative w-full h-full bg-black select-none" onClick={handleVideoTap}>

      {/* ── Media ───────────────────────────────── */}
      {videoUrl
        ? <video ref={videoRef} src={videoUrl} poster={thumbnailUrl}
                 muted={muted} loop playsInline
                 className="absolute inset-0 w-full h-full object-cover" />
        : <img   src={thumbnailUrl} alt={title}
                 className="absolute inset-0 w-full h-full object-cover" />
      }

      {/* Fade video into commerce card */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 22%, transparent 42%, rgba(8,8,10,0.88) 68%, #08080a 100%)' }} />

      {/* ── Tap-to-pause indicator ──────────────── */}
      <AnimatePresence>
        {showPause && (
          <motion.div
            className="absolute inset-x-0 flex items-center justify-center pointer-events-none z-30"
            style={{ top: 0, bottom: '38%' }}
            initial={{ opacity: 0, scale: 0.55 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.25 }}
            transition={{ duration: 0.16 }}
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
                 style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {playing
                ? <RiPauseLine size={26} className="text-white" />
                : <RiPlayLine  size={26} className="text-white ml-0.5" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Double-tap heart ────────────────────── */}
      <AnimatePresence>
        {doubleTapHeart && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1.05 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <RiHeartFill size={84}
              style={{ color: '#ef4444', filter: 'drop-shadow(0 0 30px rgba(239,68,68,0.75))' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mute — top right ────────────────────── */}
      <button
        onClick={(e) => { e.stopPropagation(); setMuted(m => !m) }}
        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {muted
          ? <RiVolumeMuteLine size={15} style={{ color: 'rgba(255,255,255,0.65)' }} />
          : <RiVolumeUpLine   size={15} style={{ color: '#22c55e' }} />
        }
      </button>

      {/* ── Commerce card ───────────────────────── */}
      <div data-card className="absolute bottom-0 left-0 right-0 z-10 px-3.5 pb-3.5 pt-0 space-y-2.5">

        {/* Creator + actions */}
        <div className="flex items-center gap-2">
          <Link to={`/profile/${creator.username}`} onClick={e => e.stopPropagation()}>
            <Avatar src={creator.avatar} name={creator.name} size="sm" />
          </Link>

          <div className="flex-1 min-w-0">
            <Link
              to={`/profile/${creator.username}`}
              onClick={e => e.stopPropagation()}
              className="text-sm font-bold text-white hover:text-amber-400 transition-colors truncate block"
            >
              @{creator.username}
            </Link>
          </div>

          {/* Follow */}
          {!isOwn && (
            <button
              onClick={handleFollow}
              className="flex-shrink-0 text-xs font-semibold rounded-full px-3 py-1 transition-all"
              style={following
                ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.12)' }
                : { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.28)' }
              }
            >
              {following ? 'Siguiendo' : '+ Seguir'}
            </button>
          )}

          {/* Like */}
          <button
            onClick={(e) => { e.stopPropagation(); handleLike() }}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all flex-shrink-0"
            style={{
              background: liked ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
              border: liked ? '1px solid rgba(239,68,68,0.28)' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {liked
              ? <RiHeartFill size={14} className="text-red-400" />
              : <RiHeartLine size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
            }
            <span className="text-xs font-medium tabular-nums"
                  style={{ color: liked ? '#f87171' : 'rgba(255,255,255,0.5)' }}>
              {formatNumber(likes + (liked ? 1 : 0))}
            </span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <RiShareForwardLine size={15} style={{ color: 'rgba(255,255,255,0.55)' }} />
          </button>
        </div>

        {/* Title */}
        <p className="text-[13px] leading-snug line-clamp-2 pl-0.5"
           style={{ color: 'rgba(255,255,255,0.78)' }}>
          {title}
        </p>

        {/* Product card */}
        {product ? (
          <Link
            to={`/product/${product.id}?ref=${video.id}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-3 rounded-2xl p-3 transition-all"
            style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.32)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
          >
            <img src={product.imageUrl} alt={product.name}
                 className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <p className="text-xs truncate mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {product.name}
              </p>
              <p className="text-base font-bold leading-none" style={{ color: '#22c55e' }}>
                {formatCurrency(product.price)}
              </p>
            </div>

            {commissionPct > 0 && (
              <div className="flex items-center gap-1 rounded-full px-2 py-1 flex-shrink-0"
                   style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)' }}>
                <RiFlashlightLine size={10} style={{ color: '#22c55e' }} />
                <span className="text-[11px] font-bold tabular-nums" style={{ color: '#22c55e' }}>
                  +{commissionPct}%
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 rounded-xl px-3 py-2 flex-shrink-0 transition-all"
                 style={{ background: '#22c55e' }}>
              <RiShoppingBag3Line size={13} style={{ color: '#0c0c0e' }} />
              <span className="text-xs font-bold" style={{ color: '#0c0c0e' }}>Ver</span>
            </div>
          </Link>
        ) : (
          <div style={{ height: '2px' }} />
        )}
      </div>
    </div>
  )
}

// ─── FeedPage ─────────────────────────────────────────────────
export default function FeedPage() {
  const [activeIdx, setActiveIdx] = useState(0)
  const [activeCat, setActiveCat] = useState('Para ti')
  const containerRef = useRef(null)

  const { isAuthenticated } = useAuthStore()
  const { data, fetchNextPage, hasNextPage } = useFeedVideos()
  const { followedUsers } = useSocialStore()
  const uploadedVideos = useVideosStore(s => s.videos)
  const remoteVideos   = data?.pages.flatMap(p => p.data ?? p) ?? []
  const allVideos      = [...uploadedVideos, ...remoteVideos]

  const videos = useMemo(() => {
    if (activeCat === 'Para ti')   return allVideos
    if (activeCat === 'Siguiendo') return allVideos.filter(v => followedUsers.includes(v.creator?.username))
    return allVideos.filter(v => v.product?.category === activeCat)
  }, [allVideos, activeCat, followedUsers])

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const h   = containerRef.current.clientHeight
    const idx = Math.round(containerRef.current.scrollTop / h)
    setActiveIdx(idx)
    if (hasNextPage && idx >= videos.length - 2) fetchNextPage()
  }, [hasNextPage, videos.length, fetchNextPage])

  const switchCat = (cat) => {
    setActiveCat(cat)
    setActiveIdx(0)
    if (containerRef.current) containerRef.current.scrollTop = 0
  }

  return (
    <div className={`flex flex-col overflow-hidden ${
      isAuthenticated
        ? 'h-[calc(100vh-7.5rem)] md:h-[calc(100vh-3.5rem)]'
        : 'h-[calc(100vh-7rem)] md:h-[calc(100vh-3.5rem)]'
    }`}>

      {/* ── Category strip ────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-hide"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#08080a' }}>
        {CATEGORIES.map(cat => {
          const active = activeCat === cat
          return (
            <button
              key={cat}
              onClick={() => switchCat(cat)}
              className="flex-shrink-0 text-xs font-semibold rounded-full px-3.5 py-1.5 transition-all"
              style={active
                ? { background: '#22c55e', color: '#0c0c0e' }
                : { background: 'rgba(255,255,255,0.05)', color: '#6b7280' }
              }
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* ── Scroll area ───────────────────────── */}
      <div className="relative flex-1 overflow-hidden bg-black">

        {/* Empty state */}
        {videos.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center z-10">
            {activeCat === 'Siguiendo' ? (
              <>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                     style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <span className="text-2xl">👀</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Seguí creadores para ver su contenido</p>
                  <p className="text-xs text-gray-600 mt-1">Todavía no seguís a nadie</p>
                </div>
                <Link to="/creators" className="btn-primary text-sm py-2.5 px-6">
                  Explorar creadores
                </Link>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                     style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-2xl">🎬</span>
                </div>
                <p className="font-semibold text-white">No hay videos en esta categoría</p>
              </>
            )}
          </div>
        )}

        {/* Snap scroll */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="scrollbar-hide"
          style={{ height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory' }}
        >
          {videos.map((video, idx) => (
            <div key={video.id} style={{ height: '100%', scrollSnapAlign: 'start', flexShrink: 0 }}>
              <VideoItem video={video} isActive={idx === activeIdx} />
            </div>
          ))}
        </div>

        {/* Progress dots — left side, vertical center */}
        {videos.length > 1 && videos.length <= 20 && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20 pointer-events-none"
               style={{ transform: 'translateY(-50%) translateY(-19%)' }}>
            {videos.slice(0, 20).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300 flex-shrink-0"
                style={{
                  width:      '3px',
                  height:      i === activeIdx ? '18px' : '4px',
                  background:  i === activeIdx ? '#22c55e' : 'rgba(255,255,255,0.18)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
