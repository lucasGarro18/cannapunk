import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  RiHeartLine, RiHeartFill, RiShareForwardLine,
  RiShoppingBag3Line, RiVolumeUpLine, RiVolumeMuteLine,
  RiUserAddLine, RiCheckLine, RiPlayLine, RiPauseLine,
} from 'react-icons/ri'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Avatar from '@/components/ui/Avatar'
import Spotlight from '@/components/ui/Spotlight'
import { formatNumber, formatCurrency } from '@/utils/format'
import { useSocialStore } from '@/store/socialStore'
import { useAuthStore } from '@/store/authStore'
import { useVideosStore } from '@/store/videosStore'
import { useFeedVideos } from '@/hooks/useVideos'
import { videosApi } from '@/services/api'
import clsx from 'clsx'

// ─── VideoItem full-screen ────────────────────────────────────
function VideoItem({ video, isActive }) {
  const [muted,   setMuted]   = useState(true)
  const [playing, setPlaying] = useState(false)
  const [showPause, setShowPause] = useState(false)
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
    e.preventDefault()
    if (!isAuthenticated) { toast.error('Iniciá sesión para seguir creadores'); return }
    if (isOwn) return
    toggleFollow(creator.username)
    toast.success(following ? `Dejaste de seguir a @${creator.username}` : `Seguís a @${creator.username}`)
  }

  const handleShare = async () => {
    const url = product?.id
      ? `${window.location.origin}/product/${product.id}?ref=${video.id}`
      : `${window.location.origin}/feed`
    try {
      if (navigator.share) await navigator.share({ title, url })
      else { await navigator.clipboard.writeText(url); toast.success('Link copiado') }
    } catch { /* user cancelled */ }
  }

  const handleVideoTap = (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return
    const now = Date.now()
    if (now - lastTap.current < 300) {
      // Double tap — like
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
        if (playing) {
          videoRef.current.pause()
          setPlaying(false)
        } else {
          videoRef.current.play?.().catch(() => {})
          setPlaying(true)
        }
        setShowPause(true)
        setTimeout(() => setShowPause(false), 900)
      }, 300)
    }
  }

  return (
    <Spotlight className="w-full h-full" color="rgba(245,158,11,0.06)">
    <div className="relative w-full h-full bg-black select-none" onClick={handleVideoTap}>
      {/* Media */}
      {videoUrl
        ? <video ref={videoRef} src={videoUrl} poster={thumbnailUrl}
                 muted={muted} loop playsInline
                 className="absolute inset-0 w-full h-full object-cover" />
        : <img src={thumbnailUrl} alt={title}
               className="absolute inset-0 w-full h-full object-cover" />
      }

      {/* Gradients */}
      <div className="absolute inset-0"
           style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.85) 100%)' }} />

      {/* Tap-to-pause icon */}
      <AnimatePresence>
        {showPause && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.18 }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
                 style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
              {playing
                ? <RiPauseLine size={32} className="text-white" />
                : <RiPlayLine  size={32} className="text-white" style={{ marginLeft: '3px' }} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Double-tap heart burst */}
      <AnimatePresence>
        {doubleTapHeart && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}>
            <RiHeartFill size={90} style={{ color: '#ef4444', filter: 'drop-shadow(0 0 24px rgba(239,68,68,0.7))' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right actions ─────────────────────── */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            <Link to={`/profile/${creator.username}`}>
              <Avatar src={creator.avatar} name={creator.name} size="md" />
            </Link>
            {!isOwn && (
              <button onClick={handleFollow}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: following ? '#fff' : '#f59e0b' }}>
                {following
                  ? <RiCheckLine  size={11} style={{ color: '#0c0c0e' }} />
                  : <RiUserAddLine size={11} style={{ color: '#0c0c0e' }} />}
              </button>
            )}
          </div>
        </div>

        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          {liked
            ? <RiHeartFill size={30} className="text-red-500 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.6))' }} />
            : <RiHeartLine size={30} className="text-white drop-shadow-lg" />}
          <span className="text-xs text-white font-semibold drop-shadow">
            {formatNumber(likes + (liked ? 1 : 0))}
          </span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <RiShareForwardLine size={28} className="text-white drop-shadow-lg" />
          <span className="text-xs text-white font-semibold drop-shadow">Compartir</span>
        </button>

        <button onClick={() => setMuted(m => !m)} className="flex flex-col items-center gap-1">
          {muted
            ? <RiVolumeMuteLine size={24} className="drop-shadow-lg" style={{ color: 'rgba(255,255,255,0.7)' }} />
            : <RiVolumeUpLine   size={24} className="drop-shadow-lg" style={{ color: 'rgba(255,255,255,0.7)' }} />}
        </button>
      </div>

      {/* ── Bottom info ───────────────────────── */}
      <div className="absolute bottom-4 left-0 right-14 px-4 space-y-2.5 z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-white drop-shadow">@{creator.username}</span>
          {commissionPct && (
            <span className="badge-neon" style={{ fontSize: '10px' }}>+{commissionPct}% comisión</span>
          )}
        </div>

        <p className="text-sm text-white leading-snug drop-shadow line-clamp-2" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          {title}
        </p>

        {product && (
          <Link to={`/product/${product.id}?ref=${video.id}`}
                className="flex items-center gap-2.5 rounded-xl p-2.5 w-fit max-w-xs"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <img src={product.imageUrl} alt={product.name}
                 className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>{product.name}</p>
              <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>{formatCurrency(product.price)}</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: '#f59e0b' }}>
              <RiShoppingBag3Line size={15} style={{ color: '#0c0c0e' }} />
            </div>
          </Link>
        )}
      </div>
    </div>
    </Spotlight>
  )
}

// ─── FeedPage ─────────────────────────────────────────────────
const CATEGORIES = ['Para ti', 'Siguiendo', 'Electronica', 'Indumentaria', 'Calzado', 'Accesorios']

export default function FeedPage() {
  const [activeIdx,  setActiveIdx]  = useState(0)
  const [activeCat,  setActiveCat]  = useState('Para ti')
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
    const h = containerRef.current.clientHeight
    const idx = Math.round(containerRef.current.scrollTop / h)
    setActiveIdx(idx)
    // Carga más cuando quedan 2 videos para el final
    if (hasNextPage && idx >= videos.length - 2) fetchNextPage()
  }, [hasNextPage, videos.length, fetchNextPage])

  return (
    // Full-screen: subtract navbar (3.5rem); on mobile+auth also bottom nav (4rem)
    <div className={`relative overflow-hidden bg-black ${
      isAuthenticated
        ? 'h-[calc(100vh-7.5rem)] md:h-[calc(100vh-3.5rem)]'
        : 'h-[calc(100vh-7rem)] md:h-[calc(100vh-3.5rem)]'
    }`}>

      {/* Category tabs — overlay at top */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-2 px-4 pt-3 pb-3 overflow-x-auto scrollbar-hide"
           style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => { setActiveCat(cat); setActiveIdx(0); if (containerRef.current) containerRef.current.scrollTop = 0 }}
                  className="flex-shrink-0 rounded-full text-xs font-semibold transition-all px-3.5 py-1.5"
                  style={activeCat === cat
                    ? { background: '#f59e0b', color: '#0c0c0e' }
                    : { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {videos.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 px-6 text-center"
             style={{ top: '3.5rem' }}>
          {activeCat === 'Siguiendo' ? (
            <>
              <p className="text-2xl">👀</p>
              <p className="font-semibold text-white">Seguí a creadores para ver su contenido acá</p>
              <Link to="/market" className="btn-primary text-sm py-2.5 px-6">Explorar creadores</Link>
            </>
          ) : (
            <>
              <p className="text-2xl">🎬</p>
              <p className="font-semibold text-white">No hay videos en esta categoría</p>
            </>
          )}
        </div>
      )}

      {/* Vertical snap scroll */}
      <div ref={containerRef} onScroll={handleScroll}
           className="scrollbar-hide"
           style={{ height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory' }}>
        {videos.map((video, idx) => (
          <div key={video.id} style={{ height: '100%', flexShrink: 0, scrollSnapAlign: 'start' }}>
            <VideoItem video={video} isActive={idx === activeIdx} />
          </div>
        ))}
      </div>

      {/* Dot progress indicators — max 12, hidden beyond */}
      {videos.length <= 20 && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20 max-h-[70vh] overflow-hidden">
          {videos.slice(0, 20).map((_, i) => (
            <div key={i}
                 className="rounded-full transition-all duration-300 flex-shrink-0"
                 style={{
                   width:  '3px',
                   height: i === activeIdx ? '18px' : '5px',
                   background: i === activeIdx ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                 }} />
          ))}
        </div>
      )}
    </div>
  )
}
