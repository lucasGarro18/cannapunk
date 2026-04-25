import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiStoreLine, RiAddLine, RiPauseCircleLine, RiPlayCircleLine,
  RiDeleteBin2Line, RiMoneyDollarCircleLine, RiShoppingBag3Line,
  RiBarChartLine, RiImageLine, RiExternalLinkLine, RiUploadCloud2Line,
  RiCloseLine, RiWifiOffLine, RiRefreshLine,
} from 'react-icons/ri'
import StatCard from '@/components/ui/StatCard'
import Spinner from '@/components/ui/Spinner'
import { useSellerOrders } from '@/hooks/useOrders'
import { useSellerProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useSellerProducts'
import { formatCurrency } from '@/utils/format'
import { productsApi } from '@/services/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const TABS = [
  { id: 'listings', label: 'Mis productos', icon: RiStoreLine    },
  { id: 'publish',  label: 'Publicar',      icon: RiAddLine      },
  { id: 'sales',    label: 'Ventas',        icon: RiBarChartLine },
]

const CATEGORIES = ['Electronica', 'Indumentaria', 'Calzado', 'Accesorios', 'Otro']

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

function SalesChart({ orders }) {
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (7 * (7 - i)))
    return { label: `S${i + 1}`, start: new Date(d), total: 0 }
  })
  for (const o of orders) {
    const d = new Date(o.createdAt)
    const idx = weeks.findIndex((w, i) => {
      const next = weeks[i + 1]
      return d >= w.start && (!next || d < next.start)
    })
    if (idx >= 0) weeks[idx].total += o.total
  }
  const max = Math.max(...weeks.map(w => w.total), 1)

  return (
    <div className="card p-5">
      <p className="text-sm font-semibold mb-4">Ventas por semana</p>
      <div className="flex items-end gap-2 h-28">
        {weeks.map((w, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              className="w-full rounded-t-md"
              style={{
                background: w.total > 0 ? 'linear-gradient(180deg,#f59e0b,#d97706)' : '#27272a',
              }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((w.total / max) * 96, w.total > 0 ? 6 : 2)}px` }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            />
            <span className="text-[9px]" style={{ color: '#4b5563' }}>{w.label}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3 pt-3" style={{ borderTop: '1px solid #27272a' }}>
        <span className="text-xs" style={{ color: '#52525b' }}>Últimas 8 semanas</span>
        <span className="text-xs font-semibold text-brand-neon">
          {formatCurrency(orders.reduce((a, o) => a + o.total, 0))} total
        </span>
      </div>
    </div>
  )
}

export default function SellerDashboard() {
  const [tab, setTab] = useState('listings')

  const { data: listings = [], isError: listingsError, refetch: refetchListings } = useSellerProducts()
  const { mutate: createProduct, isLoading: publishing } = useCreateProduct()
  const { mutate: updateProduct }                = useUpdateProduct()
  const { mutate: deleteProduct }                = useDeleteProduct()
  const { data: orders = [], isError: ordersError, refetch: refetchOrders } = useSellerOrders()

  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [imgFile, setImgFile]       = useState(null)
  const [imgPreview, setImgPreview] = useState(null)
  const [uploading, setUploading]   = useState(false)
  const fileInputRef = useRef()

  const handleImgChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImgFile(file)
    setImgPreview(URL.createObjectURL(file))
  }, [])

  const clearImg = useCallback(() => {
    setImgFile(null)
    setImgPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const activeCount = listings.filter(p => p.status === 'active').length
  const totalSales  = listings.reduce((a, p) => a + (p.salesCount ?? 0), 0)
  const totalEarned = listings.reduce((a, p) => a + ((p.salesCount ?? 0) * p.price * (p.commissionPct ?? 8) / 100), 0)

  const onPublish = async (data) => {
    let imageUrl = data.imageUrl?.trim() || ''
    if (imgFile) {
      setUploading(true)
      try {
        const res = await productsApi.uploadImage(imgFile)
        imageUrl = res.url
      } catch {
        toast.error('Error al subir la imagen')
        setUploading(false)
        return
      }
      setUploading(false)
    }
    if (!imageUrl) imageUrl = `https://picsum.photos/seed/${Date.now()}/400/400`

    createProduct({
      name:          data.name,
      description:   data.description,
      price:         Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
      category:      data.category,
      commissionPct: Number(data.commissionPct),
      stock:         Number(data.stock),
      imageUrl,
    }, {
      onSuccess: () => { reset(); clearImg(); setTab('listings') },
    })
  }

  const handleToggleStatus = (p) => {
    updateProduct({ id: p.id, status: p.status === 'active' ? 'paused' : 'active' })
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-8 space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div>
        <p className="label mb-1">Panel de vendedor</p>
        <h1 className="section-title" style={{ fontSize: '1.75rem' }}>
          Mis <span className="neon-text">ventas</span>
        </h1>
      </div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp}>
          <StatCard label="Productos activos"  value={activeCount}                      icon={RiStoreLine}             color="neon"   />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Ventas totales"     value={totalSales}                       icon={RiShoppingBag3Line}      color="purple" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Ingresos estimados" value={formatCurrency(totalEarned)}      icon={RiMoneyDollarCircleLine} color="amber"  />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Comisiones pagadas" value={formatCurrency(totalEarned * 0.6)} icon={RiBarChartLine}         color="blue"   />
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ border: '1px solid #27272a', background: '#111115' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
                  className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors overflow-hidden"
                  style={{ color: tab === id ? '#0c0c0e' : '#4b5563' }}>
            {tab === id && (
              <motion.span
                layoutId="seller-tab-bg"
                className="absolute inset-0 rounded-lg"
                style={{ background: '#f59e0b' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon size={15} />{label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >

          {/* ── Listings ──────────────────────────── */}
          {tab === 'listings' && (
            <div className="space-y-2.5">
              {listingsError && (
                <div className="card p-8 flex flex-col items-center gap-3 text-center">
                  <RiWifiOffLine size={32} style={{ color: '#4b5563' }} />
                  <p className="text-sm" style={{ color: '#52525b' }}>No se pudieron cargar los productos</p>
                  <button onClick={() => refetchListings()} className="btn-secondary gap-2 text-sm">
                    <RiRefreshLine size={15} /> Reintentar
                  </button>
                </div>
              )}
              {!listingsError && listings.length === 0 && (
                <div className="text-center py-16 space-y-3" style={{ color: '#3d3d42' }}>
                  <RiStoreLine size={36} className="mx-auto opacity-30" />
                  <p className="text-sm">Todavía no publicaste productos</p>
                  <button onClick={() => setTab('publish')} className="btn-primary gap-2">
                    <RiAddLine size={16} /> Publicar mi primer producto
                  </button>
                </div>
              )}

              {!listingsError && listings.length > 0 && (
                <motion.div className="space-y-2.5" variants={stagger} initial="hidden" animate="show">
                  {listings.map(p => (
                    <motion.div key={p.id} variants={fadeUp} className="card p-4 flex items-center gap-4">
                      <img src={p.imageUrl} alt={p.name}
                           className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm truncate">{p.name}</p>
                          <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-semibold',
                            p.status === 'active'   ? 'badge-neon'  :
                            p.status === 'pending'  ? 'badge-amber' :
                            p.status === 'rejected' ? 'badge-red'   : 'badge-gray')}>
                            {p.status === 'active'   ? 'Activo'      :
                             p.status === 'pending'  ? 'En revisión' :
                             p.status === 'rejected' ? 'Rechazado'   : 'Pausado'}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: '#4b5563' }}>{p.category} · Stock: {p.stock ?? '—'}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-sm font-bold">{formatCurrency(p.price)}</span>
                          <span className="badge-neon" style={{ fontSize: '10px' }}>+{p.commissionPct}%</span>
                          <span className="text-xs" style={{ color: '#4b5563' }}>{p.salesCount ?? 0} ventas</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {p.status === 'active' && (
                          <Link to={`/product/${p.id}`} className="btn-icon w-8 h-8" title="Ver en marketplace">
                            <RiExternalLinkLine size={15} style={{ color: '#4b5563' }} />
                          </Link>
                        )}
                        {(p.status === 'active' || p.status === 'paused') && (
                          <motion.button
                            onClick={() => handleToggleStatus(p)}
                            whileTap={{ scale: 0.9 }}
                            className="btn-icon w-8 h-8"
                            title={p.status === 'active' ? 'Pausar' : 'Activar'}>
                            {p.status === 'active'
                              ? <RiPauseCircleLine size={17} style={{ color: '#4b5563' }} />
                              : <RiPlayCircleLine  size={17} style={{ color: '#f59e0b' }} />}
                          </motion.button>
                        )}
                        <motion.button
                          onClick={() => deleteProduct(p.id)}
                          whileTap={{ scale: 0.9 }}
                          className="btn-icon w-8 h-8">
                          <RiDeleteBin2Line size={16} style={{ color: 'rgba(239,68,68,0.6)' }} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* ── Publicar ──────────────────────────── */}
          {tab === 'publish' && (
            <form onSubmit={handleSubmit(onPublish)} className="card p-5 space-y-4">
              <h2 className="font-semibold">Nuevo producto</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label block mb-1.5">Nombre del producto *</label>
                  <input {...register('name', { required: 'Requerido' })}
                         placeholder="ej: Remera Oversized Premium" className="input" />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="label block mb-1.5">Descripción *</label>
                  <textarea {...register('description', { required: 'Requerido' })}
                            rows={3} className="input resize-none"
                            placeholder="Describí el producto en detalle..." />
                  {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
                </div>

                <div>
                  <label className="label block mb-1.5">Precio (ARS) *</label>
                  <input {...register('price', { required: 'Requerido', min: 1 })}
                         type="number" placeholder="15000" className="input" />
                </div>

                <div>
                  <label className="label block mb-1.5">Precio original (opcional)</label>
                  <input {...register('originalPrice')}
                         type="number" placeholder="20000" className="input" />
                </div>

                <div>
                  <label className="label block mb-1.5">Categoría *</label>
                  <select {...register('category', { required: true })} className="input">
                    <option value="">Seleccioná...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label block mb-1.5">Stock inicial *</label>
                  <input {...register('stock', { required: true, min: 1 })}
                         type="number" placeholder="10" className="input" />
                </div>

                <div>
                  <label className="label block mb-1.5">% Comisión para creadores *</label>
                  <input {...register('commissionPct', { required: true, min: 1, max: 30 })}
                         type="number" placeholder="8" className="input" />
                  <p className="text-xs mt-1" style={{ color: '#3d3d42' }}>Recomendado: 6–15%</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="label block mb-2">Imagen del producto</label>
                  <motion.div
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={imgPreview ? {} : { borderColor: 'rgba(245,158,11,0.5)' }}
                    className="relative rounded-xl overflow-hidden cursor-pointer transition-all"
                    style={{
                      border: imgPreview ? '1px solid rgba(245,158,11,0.3)' : '2px dashed #3f3f46',
                      background: imgPreview ? 'transparent' : 'rgba(245,158,11,0.02)',
                      minHeight: '120px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {imgPreview ? (
                      <>
                        <img src={imgPreview} alt="preview"
                             className="w-full max-h-52 object-cover rounded-xl" />
                        <button type="button"
                                onClick={(e) => { e.stopPropagation(); clearImg() }}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(0,0,0,0.7)' }}>
                          <RiCloseLine size={15} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-6 px-4 space-y-2">
                        <RiUploadCloud2Line size={28} className="mx-auto" style={{ color: '#4b5563' }} />
                        <p className="text-sm" style={{ color: '#52525b' }}>Hacé click para subir una foto</p>
                        <p className="text-xs" style={{ color: '#3d3d42' }}>JPG, PNG o WEBP — máx. 5 MB</p>
                      </div>
                    )}
                  </motion.div>
                  <input ref={fileInputRef} type="file" accept="image/*"
                         className="hidden" onChange={handleImgChange} />
                  <div className="relative mt-2.5">
                    <RiImageLine className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#4b5563' }} />
                    <input {...register('imageUrl')}
                           placeholder="O pegá una URL de imagen (opcional)"
                           className="input text-sm"
                           style={{ paddingLeft: '2.25rem' }}
                           disabled={!!imgPreview} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-3.5 space-y-1" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <p className="text-sm font-medium neon-text">¿Cómo funciona la comisión?</p>
                <p className="text-xs leading-relaxed" style={{ color: '#52525b' }}>
                  Creadores que compren tu producto y suban una review en video ganarán el % que definas por cada venta generada desde su contenido. Más % = más creadores incentivados.
                </p>
              </div>

              <motion.button
                type="submit"
                disabled={publishing || uploading}
                whileTap={publishing || uploading ? {} : { scale: 0.98 }}
                className="btn-primary w-full py-3.5 gap-2">
                {uploading
                  ? <><Spinner size="sm" /> Subiendo imagen...</>
                  : publishing
                  ? <><Spinner size="sm" /> Publicando...</>
                  : <><RiAddLine size={18} /> Publicar en el marketplace</>}
              </motion.button>
            </form>
          )}

          {/* ── Ventas ────────────────────────────── */}
          {tab === 'sales' && (
            <div className="space-y-3">
              {!ordersError && orders.length > 0 && <SalesChart orders={orders} />}

              {ordersError && (
                <div className="card p-8 flex flex-col items-center gap-3 text-center">
                  <RiWifiOffLine size={32} style={{ color: '#4b5563' }} />
                  <p className="text-sm" style={{ color: '#52525b' }}>No se pudieron cargar las ventas</p>
                  <button onClick={() => refetchOrders()} className="btn-secondary gap-2 text-sm">
                    <RiRefreshLine size={15} /> Reintentar
                  </button>
                </div>
              )}

              {!ordersError && orders.length === 0 && (
                <div className="text-center py-16" style={{ color: '#3d3d42' }}>
                  <RiShoppingBag3Line size={36} className="mx-auto opacity-30 mb-3" />
                  <p className="text-sm">Todavía no tenés ventas</p>
                </div>
              )}

              {!ordersError && orders.length > 0 && (
                <motion.div className="space-y-3" variants={stagger} initial="hidden" animate="show">
                  {orders.map((order) => (
                    <motion.div key={order.id} variants={fadeUp} className="card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{order.id}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>
                            {new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(order.total)}</p>
                          <span className={clsx('text-xs font-medium',
                            order.status === 'delivered' ? 'text-brand-neon'
                            : order.status === 'shipping' ? 'text-blue-400'
                            : 'text-amber-400')}>
                            {order.status === 'delivered' ? 'Entregado'
                              : order.status === 'shipping' ? 'En camino'
                              : 'En preparación'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        {order.items.map(({ product }, i) => (
                          <img key={i} src={product.imageUrl} alt={product.name}
                               className="w-10 h-10 rounded-lg object-cover" />
                        ))}
                        <div className="flex-1 min-w-0 self-center">
                          <p className="text-xs truncate" style={{ color: '#52525b' }}>
                            {order.items.map(i => i.product.name).join(', ')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
