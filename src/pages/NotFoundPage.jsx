import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RiArrowLeftLine, RiHomeLine } from 'react-icons/ri'
import Logo from '@/components/ui/Logo'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden"
      style={{ background: '#0c0c0e' }}
    >
      {/* Ambient orb */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,230,118,0.06) 0%, rgba(0,230,118,0.02) 40%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Watermark 404 */}
      <div
        aria-hidden
        className="absolute select-none pointer-events-none font-black"
        style={{
          fontSize: 'clamp(12rem, 50vw, 26rem)',
          letterSpacing: '-0.06em',
          lineHeight: 1,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, rgba(0,230,118,0.04) 0%, transparent 60%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        404
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <Logo />

        <div className="space-y-2">
          <p
            className="font-black leading-none"
            style={{ fontSize: 'clamp(3.5rem, 15vw, 5rem)', color: '#00e676', textShadow: '0 0 48px rgba(0,230,118,0.35)' }}
          >
            404
          </p>
          <h1 className="text-xl font-bold">Página no encontrada</h1>
          <p className="text-sm leading-relaxed" style={{ color: '#52525b' }}>
            Esta URL no existe o fue movida a otra ruta.
          </p>
        </div>

        <div
          className="h-px w-20"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,230,118,0.3), transparent)' }}
        />

        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#a1a1aa' }}
          >
            <RiArrowLeftLine size={15} /> Volver
          </button>
          <Link to="/" className="btn-primary gap-2 py-2.5 px-5 rounded-2xl text-sm">
            <RiHomeLine size={15} /> Inicio
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
