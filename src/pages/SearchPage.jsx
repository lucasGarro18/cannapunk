import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  RiSearchLine, RiCloseLine, RiStarFill,
  RiVideoLine, RiUserLine, RiShoppingBag3Line,
} from 'react-icons/ri'
import Avatar from '@/components/ui/Avatar'
import { useProducts } from '@/hooks/useProducts'
import { useTopCreators } from '@/hooks/useCreators'
import { useFeedVideos } from '@/hooks/useVideos'
import { formatCurrency, formatNumber } from '@/utils/format'

const TABS = [
  { id: 'all',      label: 'Todos'     },
  { id: 'products', label: 'Productos' },
  { id: 'creators', label: 'Creadores' },
  { id: 'videos',   label: 'Videos'    },
]

export default function SearchPage() {
  const [searchParams]   = useSearchParams()
  const navigate         = useNavigate()
  const urlQ             = searchParams.get('q') ?? ''
  const [q, setQ]        = useState(urlQ)
  const [tab, setTab]    = useState('all')

  // Sync input when URL param changes (e.g. from Navbar search)
  useEffect(() => { setQ(urlQ); setTab('all') }, [urlQ])

  const query = urlQ.toLowerCase()

  const { data: prodData, isLoading: loadingProducts, isError: errorProducts } = useProducts(urlQ ? { q: urlQ } : {})
  const { data: allCreators = [] } = useTopCreators(20)
  const { data: videosData }  = useFeedVideos()

  const products  = prodData?.pages.flatMap(p => p.data ?? p) ?? []
  const allVideos = videosData?.pages.flatMap(p => p.data ?? p) ?? []

  const creators = useMemo(() =>
    allCreators.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.username.toLowerCase().includes(query) ||
      c.bio?.toLowerCase().includes(query)
    ), [query, allCreators])

  const videos = useMemo(() =>
    allVideos.filter(v =>
      v.title.toLowerCase().includes(query) ||
      v.creator?.username.toLowerCase().includes(query)
    ), [query, allVideos])

  const totalResults = products.length + creators.length + videos.length

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = q.trim()
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const showProducts = tab === 'all' || tab === 'products'
  const showCreators = tab === 'all' || tab === 'creators'
  const showVideos   = tab === 'all' || tab === 'videos'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Search input */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            autoFocus
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar productos, creadores, videos..."
            className="input"
            style={{ paddingLeft: '3rem', paddingRight: q ? '3rem' : '1rem', height: '3rem', fontSize: '1rem' }}
          />
          {q && (
            <button type="button" onClick={() => { setQ(''); navigate('/search') }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon w-8 h-8">
              <RiCloseLine size={16} />
            </button>
          )}
        </div>
      </form>

      {/* No query state */}
      {!query && (
        <div className="text-center py-20 space-y-3">
          <RiSearchLine size={48} className="mx-auto opacity-10" />
          <p className="text-gray-600">Buscá productos, creadores o videos</p>
        </div>
      )}

      {/* Error state */}
      {errorProducts && query && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
             style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#fca5a5' }}>
          <span>⚠️</span> No se pudo conectar al servidor. Los resultados pueden estar incompletos.
        </div>
      )}

      {/* Results */}
      {query && (
        <>
          {/* Summary + tabs */}
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500">
              {totalResults === 0
                ? `Sin resultados para "${urlQ}"`
                : `${totalResults} resultado${totalResults !== 1 ? 's' : ''} para "${urlQ}"`}
            </p>

            <div className="flex gap-1 p-1 rounded-xl w-fit"
                 style={{ border: '1px solid #27272a', background: '#111115' }}>
              {TABS.map(t => {
                const count = t.id === 'all' ? totalResults
                  : t.id === 'products' ? products.length
                  : t.id === 'creators' ? creators.length
                  : videos.length
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={tab === t.id
                            ? { background: '#f59e0b', color: '#080b08' }
                            : { color: '#4b5563' }}>
                    {t.label}
                    {count > 0 && (
                      <span className="text-[10px] opacity-70">({count})</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {totalResults === 0 && (
            <div className="text-center py-16 space-y-3">
              <p className="text-gray-700 text-sm">Probá con otras palabras clave</p>
              <Link to="/market" className="btn-secondary inline-flex gap-2 text-sm">
                <RiShoppingBag3Line size={15} /> Explorar el marketplace
              </Link>
            </div>
          )}

          {/* ── Productos ─── */}
          {showProducts && loadingProducts && products.length === 0 && (
            <section className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card flex items-center gap-4 p-4 animate-pulse">
                  <div className="w-16 h-16 rounded-xl bg-white/5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/5 rounded w-1/4" />
                    <div className="h-4 bg-white/5 rounded w-2/3" />
                  </div>
                  <div className="h-5 bg-white/5 rounded w-16" />
                </div>
              ))}
            </section>
          )}
          {showProducts && products.length > 0 && (
            <section className="space-y-3">
              {tab === 'all' && (
                <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                  <RiShoppingBag3Line size={15} style={{ color: '#f59e0b' }} />
                  Productos
                  <span className="badge-gray">{products.length}</span>
                </h2>
              )}
              <div className="space-y-2">
                {products.map(p => {
                  const discount = p.originalPrice
                    ? Math.round((1 - p.price / p.originalPrice) * 100) : null
                  return (
                    <Link key={p.id} to={`/product/${p.id}`}
                          className="card-hover flex items-center gap-4 p-4">
                      <img src={p.imageUrl} alt={p.name}
                           className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="label mb-0.5">{p.category}</p>
                        <p className="font-semibold text-sm truncate">{p.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <RiStarFill size={11} className="text-amber-400" />
                          <span className="text-xs text-gray-500">{p.rating}</span>
                          {p.commissionPct && <span className="badge-neon" style={{ fontSize: '10px' }}>+{p.commissionPct}%</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold">{formatCurrency(p.price)}</p>
                        {discount && <p className="text-xs text-red-400 mt-0.5">-{discount}% OFF</p>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Creadores ─── */}
          {showCreators && creators.length > 0 && (
            <section className="space-y-3">
              {tab === 'all' && (
                <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                  <RiUserLine size={15} style={{ color: '#f59e0b' }} />
                  Creadores
                  <span className="badge-gray">{creators.length}</span>
                </h2>
              )}
              <div className="space-y-2">
                {creators.map(c => (
                  <Link key={c.id} to={`/profile/${c.username}`}
                        className="card-hover flex items-center gap-4 p-4">
                    <Avatar src={c.avatar} name={c.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-gray-500">@{c.username}</p>
                      {c.bio && <p className="text-xs text-gray-600 mt-0.5 truncate">{c.bio}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      <p className="text-xs text-gray-500">{formatNumber(c.followers)} seguidores</p>
                      <p className="text-xs font-semibold" style={{ color: '#f59e0b' }}>
                        {c.videoCount} videos
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Videos ─── */}
          {showVideos && videos.length > 0 && (
            <section className="space-y-3">
              {tab === 'all' && (
                <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                  <RiVideoLine size={15} style={{ color: '#f59e0b' }} />
                  Videos
                  <span className="badge-gray">{videos.length}</span>
                </h2>
              )}
              <div className="space-y-2">
                {videos.map(v => (
                  <Link key={v.id} to={v.product ? `/product/${v.product.id}?ref=${v.id}` : '/feed'}
                        className="card-hover flex items-center gap-4 p-4">
                    <img src={v.thumbnailUrl} alt={v.title}
                         className="w-14 h-20 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm font-medium line-clamp-2 leading-snug">{v.title}</p>
                      <div className="flex items-center gap-2">
                        <Avatar src={v.creator.avatar} name={v.creator.name} size="xs" />
                        <span className="text-xs text-gray-500">@{v.creator.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">{formatNumber(v.views)} vistas</span>
                        {v.commissionPct && (
                          <span className="badge-neon" style={{ fontSize: '9px' }}>+{v.commissionPct}%</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
