import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { RiUploadCloudLine, RiVideoLine, RiCloseLine, RiCheckLine } from 'react-icons/ri'
import toast from 'react-hot-toast'
import { useFeaturedProducts } from '@/hooks/useProducts'
import { useVideosStore } from '@/store/videosStore'
import { useAuthStore } from '@/store/authStore'
import { useNotifStore } from '@/store/notifStore'
import { videosApi } from '@/services/api'
import { mockProducts } from '@/data/mockData'

export default function UploadPage() {
  const [videoFile,    setVideoFile]    = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [uploading,    setUploading]    = useState(false)
  const [progress,     setProgress]     = useState(0)
  const [dragging,     setDragging]     = useState(false)
  const navigate    = useNavigate()
  const dropRef     = useRef(null)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ mode: 'onSubmit' })
  const { data: prodData } = useFeaturedProducts()
  const allProducts = Array.isArray(prodData) ? prodData : (prodData?.pages?.flatMap(p => p.data ?? p) ?? mockProducts)
  const selectedProductId = watch('productId')
  const selectedProduct   = allProducts.find(p => p.id === selectedProductId)

  const addVideo  = useVideosStore(s => s.addVideo)
  const addNotif  = useNotifStore(s => s.addNotif)
  const { user }  = useAuthStore()

  // Revoca el blob URL al desmontar o cuando cambia el preview
  useEffect(() => {
    return () => { if (videoPreview) URL.revokeObjectURL(videoPreview) }
  }, [videoPreview])

  const setFile = useCallback((file) => {
    if (!file) return
    if (!file.type.startsWith('video/')) { toast.error('Seleccioná un archivo de video'); return }
    if (file.size > 200 * 1024 * 1024) { toast.error('El video no puede superar los 200MB'); return }
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
  }, [])

  const handleVideoChange = (e) => setFile(e.target.files?.[0])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = (e) => {
    if (!dropRef.current?.contains(e.relatedTarget)) setDragging(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    setFile(e.dataTransfer.files?.[0])
  }

  const onSubmit = async (data) => {
    if (!videoFile) {
      toast.error('Seleccioná un video primero')
      return
    }
    setUploading(true)
    const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []

    // Optimistic local store (funciona aunque el backend falle o esté offline)
    const localVideo = {
      id: 'v_' + Date.now(),
      title: data.title,
      description: data.description ?? '',
      thumbnailUrl: videoPreview,
      videoUrl: videoPreview,
      creator: { id: user.id, name: user.name, username: user.username, avatar: user.avatar ?? '' },
      product: selectedProduct ?? null,
      likes: 0, views: 0,
      commissionPct: selectedProduct?.commissionPct ?? 0,
      createdAt: new Date().toISOString(),
      tags,
    }
    addVideo(localVideo)

    // Persist to backend con progreso real
    try {
      await videosApi.upload(
        { title: data.title, description: data.description ?? '', productId: selectedProduct?.id, tags },
        videoFile,
        (pct) => setProgress(pct),
      )
    } catch { /* backend no disponible — el video ya quedó en el store local */ }
    setProgress(100)
    addNotif({
      type:  'sale',
      title: 'Video publicado',
      body:  `Tu review "${data.title}" ya está en el feed${selectedProduct ? ` · comisión ${selectedProduct.commissionPct}% activa` : ''}`,
    })
    toast.success('¡Video publicado! Ya aparece en tu perfil y en el feed.')
    reset()
    setVideoFile(null)
    setVideoPreview(null)
    setUploading(false)
    setProgress(0)
    navigate('/profile')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-punk font-bold">
          Subir <span className="neon-text">video review</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Compartí tu experiencia y ganá comisiones automáticamente
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Video upload zone */}
        <div className="card p-6">
          {videoPreview ? (
            <div className="relative">
              <video src={videoPreview} className="w-full rounded-xl max-h-80 object-contain bg-black" controls />
              <button
                type="button"
                onClick={() => { setVideoFile(null); setVideoPreview(null) }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center hover:bg-black transition-colors"
              >
                <RiCloseLine size={18} />
              </button>
            </div>
          ) : (
            <label
              ref={dropRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center gap-4 p-10 rounded-xl cursor-pointer transition-all"
              style={{
                border: dragging ? '2px solid #f59e0b' : '2px dashed rgba(255,255,255,0.12)',
                background: dragging ? 'rgba(245,158,11,0.04)' : 'transparent',
              }}>
              <RiUploadCloudLine size={48}
                style={{ color: dragging ? '#f59e0b' : '#4b5563', transition: 'color 0.15s' }} />
              <div className="text-center">
                <p className="font-medium">
                  {dragging ? 'Soltá el video acá' : 'Arrastrá tu video o hacé click para seleccionar'}
                </p>
                <p className="text-sm text-gray-500 mt-1">MP4, MOV, AVI &mdash; máx. 200MB</p>
              </div>
              <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
            </label>
          )}
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Título del video *</label>
            <input
              {...register('title', { required: 'El título es obligatorio' })}
              placeholder="ej: Review honesta de los auriculares Punk Pro"
              className="input"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Producto que estás revisando</label>
            <select {...register('productId')} className="input">
              <option value="">Sin producto asociado (opcional)</option>
              {allProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name} · {p.commissionPct}%</option>
              ))}
            </select>
            {selectedProduct && (
              <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>
                Ganá {selectedProduct.commissionPct}% por cada venta generada
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              {...register('description')}
              placeholder="Contale a la gente que vas a mostrar en el video..."
              rows={3}
              className="input resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <input
              {...register('tags')}
              placeholder="ej: electronica, review, unboxing"
              className="input"
            />
            <p className="text-xs text-gray-600 mt-1">Separados por coma</p>
          </div>
        </div>

        {/* Commission info */}
        <div className="card p-4" style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
          <p className="text-sm font-medium neon-text">Comisión estimada</p>
          <p className="text-xs text-gray-400 mt-1">
            Ganás el{' '}
            <span className="text-white font-semibold">
              {selectedProduct?.commissionPct ?? '—'}%
            </span>{' '}
            de cada venta generada por tu video. Sin límite de ganancias.
          </p>
        </div>

        <div className="space-y-2">
          {uploading && progress > 0 && progress < 100 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs" style={{ color: '#71717a' }}>
                <span>Subiendo video...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#27272a' }}>
                <div className="h-full rounded-full transition-all duration-300"
                     style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
              </div>
            </div>
          )}
          <button type="submit" disabled={uploading} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
            {uploading ? (
              progress === 100
                ? <><RiCheckLine size={20} /> Procesando...</>
                : <><div className="w-5 h-5 border-2 border-brand-dark/30 border-t-brand-dark rounded-full animate-spin" /> Subiendo {progress}%</>
            ) : (
              <><RiVideoLine size={20} /> Publicar video</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
