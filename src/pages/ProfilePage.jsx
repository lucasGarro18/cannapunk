import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiUserFollowLine, RiCheckLine, RiShareForwardLine, RiSettingsLine,
  RiVideoLine, RiShoppingBag3Line, RiHeartLine, RiDeleteBin6Line,
  RiStoreLine, RiMotorbikeLine, RiMessage3Line, RiUploadCloudLine,
  RiShieldCheckLine, RiFlashlightLine,
} from 'react-icons/ri'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import toast from 'react-hot-toast'
import Avatar from '@/components/ui/Avatar'
import VideoCard from '@/components/video/VideoCard'
import ProductCard from '@/components/product/ProductCard'
import { ProfileSkeleton, VideoCardSkeleton } from '@/components/ui/Skeleton'
import { useCreator } from '@/hooks/useCreators'
import { useCreatorVideos } from '@/hooks/useVideos'
import { useOrders } from '@/hooks/useOrders'
import { formatCurrency } from '@/utils/format'
import { useAuthStore } from '@/store/authStore'
import { useSocialStore } from '@/store/socialStore'
import { useVideosStore } from '@/store/videosStore'
import { useState, useMemo, useCallback } from 'react'
import { videosApi } from '@/services/api'
import { useQueryClient } from 'react-query'
import NumberTicker from '@/components/ui/NumberTicker'
import BorderBeam from '@/components/ui/BorderBeam'

// ─── Config ───────────────────────────────────────────────────

const ROLE_CONFIG = {
  creator:  { label: 'Creator',    Icon: RiVideoLine,       color: '#00e676', bg: 'rgba(0,230,118,0.08)',   border: 'rgba(0,230,118,0.28)',  glow: 'rgba(0,230,118,0.12)'  },
  seller:   { label: 'Seller',     Icon: RiStoreLine,       color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.28)', glow: 'rgba(96,165,250,0.12)' },
  delivery: { label: 'Delivery',   Icon: RiMotorbikeLine,   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.28)', glow: 'rgba(245,158,11,0.12)'  },
  admin:    { label: 'Admin',      Icon: RiShieldCheckLine, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.28)',glow: 'rgba(167,139,250,0.12)' },
}

const TABS = [
  { id: 'videos',    label: 'Videos'   },
  { id: 'compras',   label: 'Compras',   ownOnly: true },
  { id: 'guardados', label: 'Guardados', ownOnly: true },
]

const stagger = { show: { transition: { staggerChildren: 0.07 } } }
const fadeUp  = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16,1,0.3,1] } },
}

// ─── NeonAvatar ───────────────────────────────────────────────

function NeonAvatar({ src, name }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: 104, height: 104 }}>
      {/* Outer ambient pulse */}
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{ inset: -16, background: 'radial-gradient(circle, rgba(0,230,118,0.16) 0%, transparent 65%)' }}
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.92, 1.06, 0.92] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Rotating dashed ring */}
      <motion.svg
        aria-hidden
        className="absolute pointer-events-none"
        style={{ inset: -7, width: 'calc(100% + 14px)', height: 'calc(100% + 14px)' }}
        viewBox="0 0 118 118"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="59" cy="59" r="56" fill="none" stroke="rgba(0,230,118,0.22)" strokeWidth="1" strokeDasharray="8 6" />
      </motion.svg>
      {/* Solid neon ring */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ boxShadow: '0 0 0 2px #00e676, 0 0 24px rgba(0,230,118,0.38), 0 0 52px rgba(0,230,118,0.1)' }}
      />
      <Avatar src={src} name={name} size="2xl" className="w-full h-full" />
    </div>
  )
}

// ─── RoleBadge ────────────────────────────────────────────────

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role]
  if (!cfg) return null
  const { label, Icon, color, bg, border, glow } = cfg
  return (
    <motion.div
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
      style={{ background: bg, border: `1px solid ${border}`, color, boxShadow: `0 0 20px ${glow}, inset 0 1px 0 rgba(255,255,255,0.05)` }}
      whileHover={{ scale: 1.04, boxShadow: `0 0 30px ${glow}` }}
      transition={{ duration: 0.18 }}
    >
      <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon size={14} />
      </div>
      <span className="text-xs font-bold tracking-widest uppercase">{label}</span>
    </motion.div>
  )
}

// ─── EditorialVideos ──────────────────────────────────────────

function EditorialVideos({ videos, isOwn, onDelete, loading }) {
  if (loading && videos.length === 0) {
    return (
      <div className="space-y-3">
        <VideoCardSkeleton />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <VideoCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }
  if (videos.length === 0) {
    return (
      <motion.div
        className="py-24 flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(0,230,118,0.05)', border: '1px dashed rgba(0,230,118,0.2)', boxShadow: '0 0 40px rgba(0,230,118,0.05)' }}
        >
          <RiVideoLine size={32} style={{ color: 'rgba(0,230,118,0.35)' }} />
        </div>
        <div className="text-center space-y-1.5">
          <p className="font-bold text-sm">Sin videos todavía</p>
          {isOwn && <p className="text-xs" style={{ color: '#52525b' }}>Subí tu primer review y empezá a ganar</p>}
        </div>
        {isOwn && (
          <Link to="/upload" className="btn-primary gap-2 text-sm">
            <RiUploadCloudLine size={14} /> Subir video
          </Link>
        )}
      </motion.div>
    )
  }
  const [featured, ...rest] = videos
  return (
    <motion.div className="space-y-3" variants={stagger} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <VideoCard video={featured} onDelete={isOwn ? onDelete : undefined} />
      </motion.div>
      {rest.length > 0 && (
        <motion.div className="grid grid-cols-2 gap-3" variants={stagger}>
          {rest.map(v => (
            <motion.div key={v.id} variants={fadeUp}>
              <VideoCard video={v} compact onDelete={isOwn ? onDelete : undefined} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

function EmptyTab({ Icon, text, children }) {
  return (
    <div className="py-16 text-center space-y-4">
      <div className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <Icon size={24} className="text-gray-700" />
      </div>
      <p className="text-sm" style={{ color: '#52525b' }}>{text}</p>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function ProfilePage() {
  const { username }     = useParams()
  const navigate         = useNavigate()
  const { user: me }     = useAuthStore()
  const { isFollowing, toggleFollow } = useSocialStore()
  const [tab, setTab]    = useState('videos')
  const [tabDir, setTabDir] = useState(1)

  const isOwn          = !username || me?.username === username
  const lookupUsername = username ?? me?.username ?? ''

  const { data: creatorData, isLoading: loadingProfile } = useCreator(lookupUsername)
  const creator = creatorData ?? (isOwn && me
    ? { id: me.id, name: me.name, username: me.username, avatar: me.avatar ?? '', bio: me.bio ?? '', roles: me.roles ?? [], followers: 0, videoCount: 0, totalEarned: 0 }
    : { name: '', username: lookupUsername, avatar: '', bio: '', roles: [], followers: 0, videoCount: 0, totalEarned: 0 })

  const { data: remoteVideos = [], isLoading: loadingVideos } = useCreatorVideos(lookupUsername)
  const allUploaded    = useVideosStore(s => s.videos)
  const uploadedVideos = useMemo(() => allUploaded.filter(v => v.creator?.username === lookupUsername), [allUploaded, lookupUsername])
  const videos         = useMemo(() => [...uploadedVideos, ...remoteVideos], [uploadedVideos, remoteVideos])

  const qc = useQueryClient()
  const removeVideo = useVideosStore(s => s.removeVideo)
  const handleDeleteVideo = useCallback(async (videoId) => {
    removeVideo(videoId)
    try { await videosApi.delete(videoId) } catch { /* offline ok */ }
    qc.invalidateQueries(['videos', 'creator', lookupUsername])
    toast.success('Video eliminado')
  }, [removeVideo, qc, lookupUsername])

  const { items: wishlistItems, remove: removeWishlist } = useWishlistStore()
  const addItem  = useCartStore(s => s.addItem)
  const openCart = useUIStore(s => s.openCart)
  const { data: orders = [] } = useOrders()
  const purchasedProducts = [...new Map(orders.flatMap(o => o.items.map(i => [i.product.id, i.product]))).values()]

  const following = isFollowing(creator.username)
  const handleFollow = () => {
    toggleFollow(creator.username)
    toast.success(following ? `Dejaste de seguir a @${creator.username}` : `Seguís a @${creator.username}`)
  }
  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${creator.username}`
    try {
      if (navigator.share) await navigator.share({ title: creator.name, url })
      else { await navigator.clipboard.writeText(url); toast.success('Link copiado') }
    } catch { /* cancelled */ }
  }

  const roles       = (creator.roles ?? []).filter(r => r !== 'buyer')
  const meRoles     = me?.roles ?? []
  const visibleTabs = TABS.filter(t => !t.ownOnly || isOwn)
  const followers   = (creator.followers ?? 0) + (following && !isOwn ? 1 : 0)

  const changeTab = (next) => {
    const oldIdx = visibleTabs.findIndex(t => t.id === tab)
    const newIdx = visibleTabs.findIndex(t => t.id === next)
    setTabDir(newIdx >= oldIdx ? 1 : -1)
    setTab(next)
  }

  if (loadingProfile) return <ProfileSkeleton />

  const initial = creator.name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="max-w-2xl mx-auto pb-24 overflow-x-hidden">

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: 300 }}>

        {/* Deep dark base + green tinted bottom */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(175deg, #0a0a0c 0%, #0e100e 55%, #101410 100%)' }}
        />

        {/* Radial neon orb beneath avatar */}
        <motion.div
          aria-hidden
          className="absolute pointer-events-none"
          style={{ bottom: 40, left: '50%', transform: 'translateX(-50%)', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,230,118,0.1) 0%, rgba(0,230,118,0.03) 45%, transparent 70%)' }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Amber accent top-right */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{ top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)' }}
        />

        {/* Massive watermark initial */}
        <div
          aria-hidden
          className="absolute select-none pointer-events-none font-black leading-none"
          style={{
            fontSize: 'clamp(12rem, 50vw, 22rem)',
            bottom: -30, right: -16,
            background: 'linear-gradient(135deg, rgba(0,230,118,0.04) 0%, rgba(0,230,118,0.015) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.06em',
          }}
        >
          {initial}
        </div>

        {/* Horizontal scan lines */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)' }}
        />

        {/* Top-right controls */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <motion.button
            onClick={handleShare}
            className="flex items-center justify-center w-9 h-9 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }}
            whileHover={{ scale: 1.08, color: '#a1a1aa' }}
            whileTap={{ scale: 0.93 }}
          >
            <RiShareForwardLine size={15} />
          </motion.button>
          {isOwn && (
            <Link
              to="/settings"
              className="flex items-center justify-center w-9 h-9 rounded-2xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }}
            >
              <RiSettingsLine size={15} />
            </Link>
          )}
        </div>

        {/* Avatar — centrado y protagonista */}
        <div className="relative z-10 flex flex-col items-center pt-14 pb-8 gap-5">
          <motion.div
            initial={{ scale: 0.65, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.16,1,0.3,1] }}
          >
            <NeonAvatar src={creator.avatar} name={creator.name} />
          </motion.div>

          {/* Name + username inline bajo el avatar */}
          <motion.div
            className="text-center space-y-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
          >
            <h1
              className="font-black leading-tight tracking-tight"
              style={{ fontSize: 'clamp(1.85rem, 7vw, 2.6rem)' }}
            >
              {creator.name}
            </h1>
            <p className="font-mono text-sm" style={{ color: '#3f3f46' }}>
              <span style={{ color: 'rgba(0,230,118,0.5)' }}>@</span>
              <span style={{ color: '#52525b' }}>{creator.username}</span>
            </p>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 inset-x-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #111113, transparent)' }}
        />
      </section>

      {/* ══ BIO + ROLES ═══════════════════════════════════════════ */}
      <motion.section
        className="px-5 pt-1 pb-6 space-y-4"
        variants={stagger} initial="hidden" animate="show"
      >
        {creator.bio && (
          <motion.p
            variants={fadeUp}
            className="text-sm leading-relaxed text-center"
            style={{ color: '#71717a', maxWidth: '36ch', margin: '0 auto' }}
          >
            {creator.bio}
          </motion.p>
        )}

        {roles.length > 0 && (
          <motion.div variants={fadeUp} className="flex flex-wrap gap-2 justify-center">
            {roles.map(r => <RoleBadge key={r} role={r} />)}
          </motion.div>
        )}
      </motion.section>

      {/* ══ STATS BENTO ═══════════════════════════════════════════ */}
      <section className="px-5 pb-5">
        <motion.div className="space-y-2" variants={stagger} initial="hidden" animate="show">

          {/* Hero stat — Total ganado */}
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-3xl p-6"
            style={{
              background: 'linear-gradient(var(--cp-card), var(--cp-card)) padding-box, linear-gradient(135deg, rgba(0,230,118,0.32) 0%, transparent 50%, rgba(245,158,11,0.12) 100%) border-box',
              border: '1px solid transparent',
            }}
          >
            <BorderBeam colorFrom="#00e676" colorTo="#f59e0b" duration={8} />
            <div className="absolute top-0 right-0 w-52 h-52 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(0,230,118,0.07) 0%, transparent 60%)' }} />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: '#3d3d42' }}>Total ganado</p>
                <p
                  className="font-black leading-none"
                  style={{ fontSize: 'clamp(2.8rem, 10vw, 3.75rem)', color: '#00e676', textShadow: '0 0 48px rgba(0,230,118,0.4), 0 0 88px rgba(0,230,118,0.12)' }}
                >
                  {creator.totalEarned >= 1000
                    ? <NumberTicker num={(creator.totalEarned ?? 0) / 1000} decimals={1} prefix="$" suffix="K" />
                    : formatCurrency(creator.totalEarned ?? 0)}
                </p>
                <p className="text-[11px] mt-2 font-mono" style={{ color: 'rgba(0,230,118,0.45)' }}>
                  en comisiones · {creator.videoCount ?? videos.length} videos
                </p>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1"
                style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.18)' }}
              >
                <RiFlashlightLine size={24} style={{ color: '#00e676' }} />
              </div>
            </div>
          </motion.div>

          {/* Seguidores · Videos · Rating */}
          <motion.div className="grid grid-cols-3 gap-2" variants={stagger}>
            {[
              { value: followers >= 10000 ? <NumberTicker num={followers / 1000} decimals={1} suffix="K" /> : <NumberTicker num={followers} decimals={0} />, label: 'Seguidores', color: '#fafafa' },
              { value: <NumberTicker num={creator.videoCount ?? videos.length} decimals={0} />, label: 'Videos', gradient: true },
              { value: '4.9', label: 'Rating', color: '#fbbf24' },
            ].map(({ value, label, color, gradient }) => (
              <motion.div
                key={label}
                variants={fadeUp}
                className="bento rounded-3xl flex flex-col items-center justify-center gap-2 py-5 px-3"
              >
                <p
                  className={`font-black leading-none ${gradient ? 'gradient-text' : ''}`}
                  style={{ fontSize: 'clamp(1.6rem, 6vw, 2.1rem)', ...(color && !gradient ? { color } : {}) }}
                >
                  {value}
                </p>
                <p className="text-[9px] uppercase tracking-[0.16em] font-bold" style={{ color: '#3d3d42' }}>{label}</p>
              </motion.div>
            ))}
          </motion.div>

        </motion.div>
      </section>

      {/* ══ ACTIONS ═══════════════════════════════════════════════ */}
      <section className="px-5 pb-6">
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          {isOwn ? (
            <>
              <Link to="/upload" className="btn-primary flex-1 gap-2 py-3.5 rounded-2xl text-sm">
                <RiUploadCloudLine size={15} /> Subir video
              </Link>
              {meRoles.includes('seller') && (
                <Link
                  to="/seller"
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.22)', color: '#60a5fa' }}
                >
                  <RiStoreLine size={15} />
                </Link>
              )}
              {meRoles.includes('delivery') && (
                <Link
                  to="/delivery"
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)', color: '#f59e0b' }}
                >
                  <RiMotorbikeLine size={15} />
                </Link>
              )}
              <Link
                to="/settings"
                className="flex items-center justify-center px-4 py-3.5 rounded-2xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }}
              >
                <RiSettingsLine size={15} />
              </Link>
            </>
          ) : (
            <>
              <motion.button
                onClick={handleFollow}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all"
                style={following
                  ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa' }
                  : { background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.32)', color: '#00e676', boxShadow: '0 0 24px rgba(0,230,118,0.1)' }
                }
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {following ? <RiCheckLine size={15} /> : <RiUserFollowLine size={15} />}
                {following ? 'Siguiendo' : 'Seguir'}
              </motion.button>
              <motion.button
                onClick={() => navigate(`/chat?with=${creator.id}`)}
                className="flex items-center justify-center px-5 py-3.5 rounded-2xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#fafafa' }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <RiMessage3Line size={16} />
              </motion.button>
              <motion.button
                onClick={handleShare}
                className="flex items-center justify-center px-4 py-3.5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <RiShareForwardLine size={15} />
              </motion.button>
            </>
          )}
        </motion.div>
      </section>

      {/* ══ NEON DIVIDER ══════════════════════════════════════════ */}
      <div className="mx-5 mb-5" style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(0,230,118,0.08) 20%, rgba(0,230,118,0.22) 50%, rgba(0,230,118,0.08) 80%, transparent 100%)' }} />

      {/* ══ TABS (pill selector) ══════════════════════════════════ */}
      <div className="px-5 pb-1">
        <div
          className="flex gap-1 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.055)' }}
        >
          {visibleTabs.map(t => (
            <button
              key={t.id}
              onClick={() => changeTab(t.id)}
              className="relative flex-1 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all"
              style={tab === t.id ? { color: '#fafafa' } : { color: '#3f3f46' }}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="profile-tab-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.07)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)' }}
                  transition={{ duration: 0.2, ease: [0.16,1,0.3,1] }}
                />
              )}
              <span className="relative">
                {t.label}
                {t.id === 'guardados' && wishlistItems.length > 0 && (
                  <span
                    className="absolute -top-2 -right-3 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                    style={{ background: '#ef4444', color: '#fff' }}
                  >
                    {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ══ TAB CONTENT ════════════════════════════════════════════ */}
      <div className="px-5 pt-5 min-h-[280px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: tabDir * 22 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: tabDir * -22 }}
            transition={{ duration: 0.22, ease: [0.16,1,0.3,1] }}
          >

            {tab === 'videos' && (
              <EditorialVideos
                videos={videos}
                isOwn={isOwn}
                onDelete={handleDeleteVideo}
                loading={loadingVideos}
              />
            )}

            {tab === 'compras' && (
              !isOwn
                ? <EmptyTab Icon={RiShoppingBag3Line} text="Contenido privado" />
                : purchasedProducts.length > 0
                  ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {purchasedProducts.slice(0, 6).map(p => <ProductCard key={p.id} product={p} />)}
                      </div>
                      <div className="text-center pt-1">
                        <Link to="/orders" className="text-xs font-semibold" style={{ color: '#f59e0b' }}>
                          Ver todos mis pedidos →
                        </Link>
                      </div>
                    </div>
                  )
                  : (
                    <EmptyTab Icon={RiShoppingBag3Line} text="Sin compras todavía">
                      <Link to="/market" className="btn-secondary text-sm inline-flex gap-2 mt-2">
                        <RiStoreLine size={14} /> Explorar tienda
                      </Link>
                    </EmptyTab>
                  )
            )}

            {tab === 'guardados' && isOwn && (
              wishlistItems.length > 0
                ? (
                  <div className="space-y-2.5">
                    {wishlistItems.map(product => (
                      <div key={product.id} className="card-hover flex items-center gap-3.5 p-3.5 rounded-2xl">
                        <Link to={`/product/${product.id}`} className="flex-shrink-0">
                          <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-xl object-cover" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/product/${product.id}`}>
                            <p className="text-sm font-medium line-clamp-1 hover:text-brand-neon transition-colors">{product.name}</p>
                          </Link>
                          <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>{product.category}</p>
                          <p className="text-sm font-bold mt-1 neon-text">{formatCurrency(product.price)}</p>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => { addItem(product); openCart(); toast.success('Agregado al carrito') }}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            <RiShoppingBag3Line size={12} />
                          </button>
                          <button
                            onClick={() => removeWishlist(product.id)}
                            className="flex items-center justify-center py-1.5 px-3 rounded-lg text-xs transition-colors"
                            style={{ background: 'rgba(239,68,68,0.07)', color: '#f87171' }}
                          >
                            <RiDeleteBin6Line size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-1 text-center">
                      <Link to="/wishlist" className="text-xs transition-colors hover:text-gray-400" style={{ color: '#3f3f46' }}>
                        Ver página completa →
                      </Link>
                    </div>
                  </div>
                )
                : (
                  <EmptyTab Icon={RiHeartLine} text="Sin productos guardados">
                    <Link to="/market" className="btn-secondary text-sm inline-flex gap-2 mt-2">
                      <RiStoreLine size={14} /> Explorar tienda
                    </Link>
                  </EmptyTab>
                )
            )}

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  )
}
