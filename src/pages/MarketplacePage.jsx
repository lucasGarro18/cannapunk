import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RiSearchLine, RiGridLine, RiListCheck, RiShoppingBag3Line, RiWifiOffLine, RiRefreshLine } from 'react-icons/ri'
import ProductCard from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { useProducts } from '@/hooks/useProducts'
import { formatCurrency } from '@/utils/format'
import clsx from 'clsx'

const CATEGORY_LABELS = ['Todos', 'Electronica', 'Indumentaria', 'Calzado', 'Accesorios']

const SORT_OPTIONS = [
  { value: 'popular',    label: 'Más popular'    },
  { value: 'commission', label: 'Mayor comisión' },
  { value: 'newest',     label: 'Más nuevo'      },
  { value: 'price_asc',  label: 'Menor precio'   },
  { value: 'price_desc', label: 'Mayor precio'   },
]

export default function MarketplacePage() {
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('Todos')
  const [sort,     setSort]     = useState('popular')
  const [grid,     setGrid]     = useState(true)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [discount, setDiscount] = useState(false)

  const filters = useMemo(() => ({
    sort,
    ...(category !== 'Todos' && { category }),
    ...(search && { q: search }),
    ...(minPrice && { minPrice: Number(minPrice) }),
    ...(maxPrice && { maxPrice: Number(maxPrice) }),
    ...(discount && { discount: '1' }),
  }), [sort, category, search, minPrice, maxPrice, discount])

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useProducts(filters)
  const allProducts = data?.pages.flatMap(p => p.data ?? p) ?? []

  const categoryCounts = useMemo(() => {
    const map = { Todos: allProducts.length }
    CATEGORY_LABELS.slice(1).forEach(cat => {
      map[cat] = allProducts.filter(p => p.category === cat).length
    })
    return map
  }, [allProducts])

  // Client-side fallback sort for mock data
  const filtered = useMemo(() => {
    let list = allProducts
    if (sort === 'price_asc')  list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'commission') list = [...list].sort((a, b) => (b.commissionPct ?? 0) - (a.commissionPct ?? 0))
    if (sort === 'newest')     list = [...list].sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
    return list
  }, [sort, allProducts])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-7">
        <p className="label mb-1">Marketplace</p>
        <h1 className="section-title" style={{ fontSize: '1.75rem' }}>
          Comprá y <span className="gradient-text">ganá comisión</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
          {allProducts.length} productos · hasta 14% de comisión por tu video
        </p>
      </div>

      {/* Search + sort + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
          <input
            type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="input"
            style={{ paddingLeft: '2.25rem', height: '2.5rem', fontSize: '0.875rem' }}
          />
        </div>

        <select value={sort} onChange={e => setSort(e.target.value)}
                className="input sm:w-44"
                style={{ height: '2.5rem', fontSize: '0.875rem' }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl"
             style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { v: true,  Icon: RiGridLine },
            { v: false, Icon: RiListCheck },
          ].map(({ v, Icon }) => (
            <button key={String(v)} onClick={() => setGrid(v)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                    style={grid === v
                      ? { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
                      : { color: '#52525b' }}>
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Price range + discount filter */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Precio</span>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-600">$</span>
            <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                   placeholder="Mín" className="input text-xs w-24"
                   style={{ paddingLeft: '1.4rem', height: '2rem' }} />
          </div>
          <span className="text-gray-600 text-xs">—</span>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-600">$</span>
            <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                   placeholder="Máx" className="input text-xs w-24"
                   style={{ paddingLeft: '1.4rem', height: '2rem' }} />
          </div>
        </div>
        <button onClick={() => setDiscount(d => !d)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={discount
                  ? { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)' }
                  : { border: '1px solid rgba(255,255,255,0.08)', color: '#71717a' }}>
          % Con descuento
        </button>
        {(minPrice || maxPrice || discount) && (
          <button onClick={() => { setMinPrice(''); setMaxPrice(''); setDiscount(false) }}
                  className="text-xs text-gray-500 hover:text-gray-300 underline">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-7">
        {CATEGORY_LABELS.map(label => (
          <button key={label} onClick={() => setCategory(label)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={category === label
                    ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0c0c0e', boxShadow: '0 4px 14px rgba(245,158,11,0.2)' }
                    : { border: '1px solid rgba(255,255,255,0.08)', color: '#71717a', background: 'transparent' }}>
            {label}
            {categoryCounts[label] !== undefined && (
              <span style={{ fontSize: '10px', opacity: 0.6 }}>{categoryCounts[label]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Products */}
      {isError && allProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
               style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <RiWifiOffLine size={28} style={{ color: '#f87171' }} />
          </div>
          <div>
            <p className="font-semibold">No se pudo cargar el marketplace</p>
            <p className="text-sm text-gray-600 mt-1">Revisá tu conexión e intentá de nuevo</p>
          </div>
          <button onClick={() => refetch()}
                  className="btn-primary gap-2 text-sm">
            <RiRefreshLine size={15} /> Reintentar
          </button>
        </div>
      ) : isLoading && allProducts.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: '#374151' }}>
          <RiSearchLine size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No se encontraron productos para "{search}"</p>
        </div>
      ) : grid ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(p => (
            <div key={p.id} className="card-hover flex items-center gap-4 p-4">
              <img src={p.imageUrl} alt={p.name}
                   className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="label mb-0.5">{p.category}</p>
                <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#6b7280' }}>{p.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-bold text-white">{formatCurrency(p.price)}</span>
                  {p.commissionPct && <span className="badge-neon">+{p.commissionPct}%</span>}
                </div>
              </div>
              <Link to={`/product/${p.id}`}
                    className="btn-primary flex-shrink-0 text-sm py-2 px-4 gap-1.5">
                <RiShoppingBag3Line size={14} /> Comprar
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && !search && category === 'Todos' && (
        <div className="flex justify-center pt-6">
          <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
                  className="btn-secondary gap-2 px-8">
            {isFetchingNextPage ? 'Cargando...' : 'Ver más productos'}
          </button>
        </div>
      )}
    </div>
  )
}
