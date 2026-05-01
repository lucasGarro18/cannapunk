import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  RiShoppingBag3Line, RiStoreLine, RiVideoLine,
  RiMotorbikeLine, RiArrowRightLine, RiCheckLine,
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import Logo from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'
import { useUpdateUser } from '@/hooks/useAuth'

const ROLES = [
  {
    id: 'buyer',
    icon: RiShoppingBag3Line,
    title: 'Comprador',
    desc: 'Comprá productos del marketplace y accedé a comisiones al subir tu review.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    always: true,
  },
  {
    id: 'creator',
    icon: RiVideoLine,
    title: 'Creador',
    desc: 'Subí videos de tus compras y generá ingresos automáticos por cada venta que produzca tu contenido.',
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.08)',
    border: 'rgba(192,132,252,0.25)',
  },
  {
    id: 'seller',
    icon: RiStoreLine,
    title: 'Vendedor',
    desc: 'Publicá tus productos en el marketplace y accedé a una red de creadores que los promocionen.',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.25)',
  },
  {
    id: 'delivery',
    icon: RiMotorbikeLine,
    title: 'Repartidor',
    desc: 'Gestioná entregas y ganá por cada pedido que completes en tu zona.',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.25)',
  },
]

export default function OnboardingPage() {
  const navigate    = useNavigate()
  const { user }    = useAuthStore()
  const { mutate: updateUser, isLoading } = useUpdateUser()
  const [selected, setSelected] = useState(user?.roles?.length ? user.roles : ['buyer'])

  const toggle = (id) => {
    if (id === 'buyer') return  // siempre activo
    setSelected(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const handleConfirm = () => {
    updateUser(
      { roles: selected, onboardingDone: true },
      {
        onSuccess: () => {
          if (user?.email) localStorage.setItem(`cannapont-ob-${user.email}`, '1')
          navigate('/')
        },
      },
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
         style={{ background: 'linear-gradient(180deg, #0c0c0e 0%, #111115 100%)' }}>
      <div className="w-full max-w-xl space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-3">
          <Logo size="lg" />
          <div>
            <h1 className="text-2xl font-bold mt-6">
          Hola, <span className="neon-text">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              ¿Qué querés hacer en Cannapont? Podés elegir varios roles.
            </p>
          </div>
        </motion.div>

        {/* Role cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 gap-3">
          {ROLES.map(({ id, icon: Icon, title, desc, color, bg, border, always }) => {
            const active = selected.includes(id)
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                className="relative text-left p-4 rounded-2xl transition-all duration-200 space-y-3"
                style={{
                  background: active ? bg : '#18181c',
                  border: `1px solid ${active ? border : '#27272a'}`,
                  boxShadow: active ? `0 0 16px ${color}20` : 'none',
                }}
              >
                {/* Check */}
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                     style={{
                       background: active ? color : '#27272a',
                       border: active ? 'none' : '1px solid #2a352a',
                     }}>
                  {active && <RiCheckLine size={12} style={{ color: '#0c0c0e' }} />}
                </div>

                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{ background: active ? bg : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? border : '#27272a'}` }}>
                  <Icon size={20} style={{ color: active ? color : '#4b5563' }} />
                </div>

                <div>
                  <p className="font-semibold text-sm" style={{ color: active ? '#fff' : '#9ca3af' }}>
                    {title}
                    {always && <span className="ml-1.5 badge-neon" style={{ fontSize: '9px' }}>siempre</span>}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: active ? '#9ca3af' : '#4b5563' }}>
                    {desc}
                  </p>
                </div>
              </button>
            )
          })}
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <button onClick={handleConfirm} disabled={isLoading}
                  className="btn-primary w-full py-4 text-base gap-2 shadow-neon">
            {isLoading ? 'Guardando...' : <>Empezar con {selected.length} rol{selected.length !== 1 ? 'es' : ''} <RiArrowRightLine size={18} /></>}
          </button>
          <p className="text-center text-xs text-gray-700 mt-3">
            Podés cambiar tus roles en cualquier momento desde tu perfil
          </p>
        </motion.div>
      </div>
    </div>
  )
}
