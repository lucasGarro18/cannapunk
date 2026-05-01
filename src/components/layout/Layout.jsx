import { Outlet, Navigate, useLocation, Link } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import CartDrawer from '@/components/cart/CartDrawer'
import { useAuthStore } from '@/store/authStore'
import { useChatSocket } from '@/hooks/useChat'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { RiDownloadLine, RiCloseLine, RiVideoLine, RiShoppingBag3Line, RiUserStarLine, RiSearchLine } from 'react-icons/ri'
import Logo from '@/components/ui/Logo'

// Rutas públicas que pueden verse sin autenticación
const PUBLIC_PATHS = ['/feed', '/market', '/product', '/profile', '/search', '/notifications']

function PWABanner() {
  const { canInstall, install, dismiss } = usePWAInstall()
  if (!canInstall) return null
  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50
                    rounded-2xl p-4 flex items-center gap-3 shadow-2xl"
         style={{ background: '#1c1c1f', border: '1px solid rgba(245,158,11,0.3)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: '#111113', border: '1px solid #27272a' }}>
        <Logo size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Instalar Cannapont</p>
        <p className="text-xs text-gray-500 mt-0.5">Accedé más rápido desde tu pantalla de inicio</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={install}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0c0c0e' }}>
          <RiDownloadLine size={13} /> Instalar
        </button>
        <button onClick={dismiss} className="btn-icon w-7 h-7">
          <RiCloseLine size={15} />
        </button>
      </div>
    </div>
  )
}

const GUEST_NAV = [
  { to: '/feed',     icon: RiVideoLine,        label: 'Feed'      },
  { to: '/market',   icon: RiShoppingBag3Line, label: 'Tienda'    },
  { to: '/creators', icon: RiUserStarLine,     label: 'Creadores' },
  { to: '/search',   icon: RiSearchLine,       label: 'Buscar'    },
]

function GuestBottomNav() {
  const location = useLocation()
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
         style={{ background: 'rgba(10,10,14,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
      <div className="flex">
        {GUEST_NAV.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to
          return (
            <Link key={to} to={to}
                  className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
                  style={{ color: active ? '#f59e0b' : '#4b5563' }}>
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
        <Link to="/register"
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5"
              style={{ color: '#f59e0b' }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
               style={{ background: '#f59e0b', color: '#0c0c0e' }}>+</div>
          <span className="text-[10px] font-semibold" style={{ color: '#f59e0b' }}>Unirme</span>
        </Link>
      </div>
    </div>
  )
}

export default function Layout() {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  useChatSocket()

  const isPublic = location.pathname === '/' ||
    PUBLIC_PATHS.some(p => location.pathname.startsWith(p))

  // No autenticado en ruta privada → login
  if (!isAuthenticated && !isPublic) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  // Autenticado sin onboarding → onboarding
  if (isAuthenticated && user && !user.onboardingDone) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      <Navbar />
      <main className={`flex-1 ${isAuthenticated ? 'pb-20 md:pb-0' : 'pb-16 md:pb-0'}`}>
        <Outlet />
      </main>
      {isAuthenticated  && <BottomNav />}
      {!isAuthenticated && <GuestBottomNav />}
      {isAuthenticated  && <CartDrawer />}
      <PWABanner />
    </div>
  )
}
