import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  RiSearchLine, RiUserAddLine, RiCheckLine,
  RiTrophyLine, RiVideoLine, RiFlashlightLine,
  RiMedalLine,
} from 'react-icons/ri'
import Avatar from '@/components/ui/Avatar'
import { useTopCreators } from '@/hooks/useCreators'
import { useSocialStore } from '@/store/socialStore'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatNumber } from '@/utils/format'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const CATEGORIES = ['Todos', 'Electronica', 'Indumentaria', 'Calzado', 'Accesorios']

const MEDAL_COLORS = [
  { bg: 'linear-gradient(135deg,#f59e0b,#fcd34d)', shadow: 'rgba(245,158,11,0.4)', label: '#0c0c0e' },
  { bg: 'linear-gradient(135deg,#9ca3af,#d1d5db)', shadow: 'rgba(156,163,175,0.3)', label: '#0c0c0e' },
  { bg: 'linear-gradient(135deg,#b45309,#d97706)', shadow: 'rgba(180,83,9,0.3)',   label: '#0c0c0e' },
]

const stagger = { show: { transition: { staggerChildren: 0.04 } } }
const fadeUp  = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16,1,0.3,1] } },
}

function FollowBtn({ username }) {
  const { isAuthenticated }               = useAuthStore()
  const { isFollowing, toggleFollow }     = useSocialStore()
  const following = isFollowing(username)

  const handleFollow = (e) => {
    e.preventDefault()
    if (!isAuthenticated) { toast.error('Iniciá sesión para seguir creadores'); return }
    toggleFollow(username)
    if (!following) toast.success(`Seguís a @${username}`)
  }

  return (
    <button
      onClick={handleFollow}
      className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all flex-shrink-0"
      style={following
        ? { border: '1px solid #3f3f46', color: '#71717a' }
        : { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0c0c0e' }}>
      {following ? <RiCheckLine size={13} /> : <RiUserAddLine size={13} />}
      {following ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}

/* Podium top 3 */
function Podium({ top3 }) {
  if (top3.length < 3) return null
  const order = [top3[1], top3[0], top3[2]]
  const heights = ['h-24', 'h-32', 'h-20']
  const positions = [1, 0, 2]

  return (
    <div className="flex items-end justify-center gap-3 pt-4 pb-2">
      {order.map((creator, i) => {
        const rank = positions[i]
        const medal = MEDAL_COLORS[rank]
        return (
          <motion.div key={creator.id} variants={fadeUp}
                      className="flex flex-col items-center gap-2 flex-1 max-w-[110px]">
            <Link to={`/profile/${creator.username}`} className="flex flex-col items-center gap-2">
              <div className="relative">
                <Avatar src={creator.avatar} name={creator.name}
                        size={rank === 0 ? '2xl' : 'xl'} ring={rank === 0} />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                     style={{ background: medal.bg, color: medal.label, boxShadow: `0 2px 8px ${medal.shadow}` }}>
                  {rank + 1}
                </div>
              </div>
              <div className="text-center">
                <p className={clsx('font-semibold truncate max-w-[100px]', rank === 0 ? 'text-sm' : 'text-xs')}>
                  {creator.name.split(' ')[0]}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">{formatCurrency(creator.totalEarned)}</p>
              </div>
            </Link>
            {/* Podium platform */}
            <div className={clsx('w-full rounded-t-xl', heights[i])}
                 style={{ background: rank === 0
                   ? 'linear-gradient(180deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))'
                   : 'linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))',
                   border: '1px solid rgba(255,255,255,0.07)',
                   borderBottom: 'none',
                 }} />
          </motion.div>
        )
      })}
    </div>
  )
}

export default function CreatorsPage() {
  const [q,        setQ]        = useState('')
  const [category, setCategory] = useState('Todos')
  const { data: allCreators = [], isLoading, isError } = useTopCreators(50)

  const filtered = useMemo(() => {
    let list = allCreators
    if (category !== 'Todos') list = list.filter(c => c.category === category)
    if (q) {
      const lq = q.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(lq) ||
        c.username.toLowerCase().includes(lq) ||
        c.bio?.toLowerCase().includes(lq)
      )
    }
    return list.sort((a, b) => (b.totalEarned ?? 0) - (a.totalEarned ?? 0))
  }, [allCreators, category, q])

  const top3 = filtered.slice(0, 3)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div>
        <p className="label mb-1">Comunidad</p>
        <h1 className="section-title" style={{ fontSize: '1.75rem' }}>
          Top <span className="neon-text">creadores</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: '#52525b' }}>
          {allCreators.length} creadores activos este mes
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nombre, @usuario o tema..."
          className="input"
          style={{ paddingLeft: '2.5rem', height: '2.75rem' }}
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                  style={category === cat
                    ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0c0c0e', boxShadow: '0 4px 14px rgba(245,158,11,0.2)' }
                    : { border: '1px solid rgba(255,255,255,0.08)', color: '#71717a' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Podium */}
      {!q && category === 'Todos' && top3.length === 3 && (
        <motion.div variants={stagger} initial="hidden" animate="show"
                    className="card overflow-hidden">
          <div className="p-4 border-b border-brand-border flex items-center gap-2">
            <RiTrophyLine size={16} className="text-brand-neon" />
            <h2 className="font-semibold text-sm">Ranking del mes</h2>
          </div>
          <div className="px-4 pb-0 pt-4">
            <Podium top3={top3} />
          </div>
        </motion.div>
      )}

      {/* Error banner */}
      {isError && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
             style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#fca5a5' }}>
          <span className="text-base">⚠️</span>
          No se pudo cargar el ranking actualizado. Mostrando datos en caché.
        </div>
      )}

      {/* Full list */}
      <motion.div className="space-y-2" variants={stagger} initial="hidden" animate="show">
        {isLoading && allCreators.length === 0 && (
          [...Array(6)].map((_, i) => (
            <div key={i} className="card-hover flex items-center gap-3 p-3.5 animate-pulse">
              <div className="w-8 flex-shrink-0" />
              <div className="w-10 h-10 rounded-full bg-white/5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded w-1/3" />
                <div className="h-2.5 bg-white/5 rounded w-1/4" />
              </div>
              <div className="w-16 h-7 rounded-full bg-white/5" />
            </div>
          ))
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-700">
            <RiSearchLine size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Sin resultados para "{q}"</p>
          </div>
        )}

        {filtered.map((creator, i) => {
          const rank = i + 1
          const isMedal = rank <= 3 && !q && category === 'Todos'
          const medal = isMedal ? MEDAL_COLORS[rank - 1] : null
          const weeklyEarned = Math.round(creator.totalEarned * 0.04)

          return (
            <motion.div key={creator.id} variants={fadeUp}>
              <Link to={`/profile/${creator.username}`}
                    className="card-hover flex items-center gap-3 p-3.5">
                {/* Rank */}
                <div className="w-8 text-center flex-shrink-0">
                  {isMedal ? (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold"
                         style={{ background: medal.bg, color: medal.label }}>
                      {rank}
                    </div>
                  ) : (
                    <span className="text-sm font-bold" style={{ color: '#3f3f46' }}>{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar src={creator.avatar} name={creator.name} size="md" />

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold truncate">{creator.name}</p>
                    {rank === 1 && !q && (
                      <span className="badge-neon text-[9px]">
                        <RiMedalLine size={9} className="inline" /> #1
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">@{creator.username}</p>
                  {creator.bio && (
                    <p className="text-xs text-gray-600 truncate">{creator.bio}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0 space-y-1 hidden sm:block">
                  <p className="text-xs font-bold neon-text">{formatCurrency(creator.totalEarned)}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-600 justify-end">
                    <span>{formatNumber(creator.followers)} seguidores</span>
                    <span>·</span>
                    <RiVideoLine size={10} />
                    <span>{creator.videoCount}</span>
                  </div>
                </div>

                {/* Follow */}
                <div onClick={e => e.preventDefault()}>
                  <FollowBtn username={creator.username} />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>

      {/* CTA para nuevos */}
      {!q && (
        <div className="card p-5 text-center space-y-3"
             style={{ border: '1px solid rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.02)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
               style={{ background: 'rgba(245,158,11,0.08)' }}>
            <RiFlashlightLine size={22} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <p className="font-semibold text-sm">¿Querés aparecer acá?</p>
            <p className="text-xs text-gray-500 mt-1">
              Subí una review en video y empezá a generar comisiones. Los mejores creadores escalan el ranking automáticamente.
            </p>
          </div>
          <Link to="/upload" className="btn-primary inline-flex gap-2 text-sm py-2.5 px-6">
            Subir mi primer video
          </Link>
        </div>
      )}
    </div>
  )
}
