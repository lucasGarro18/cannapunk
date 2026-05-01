import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  RiSearchLine, RiBellLine, RiShoppingBag3Line, RiCloseLine,
  RiMessage3Line, RiHeartLine, RiUserStarLine, RiShieldUserLine,
} from 'react-icons/ri'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { useNotifications } from '@/hooks/useNotifications'
import { useUnreadCount }   from '@/hooks/useChat'
import Avatar from '@/components/ui/Avatar'
import Logo from '@/components/ui/Logo'
import clsx from 'clsx'

const NAV_LINKS = [
  { to: '/feed',     label: 'Feed'      },
  { to: '/market',   label: 'Tienda'    },
  { to: '/creators', label: 'Creadores' },
]

export default function Navbar() {
  const { user, isAuthenticated } = useAuthStore()
  const cartCount      = useCartStore(s => s.items.reduce((a, i) => a + i.qty, 0))
  const openCart       = useUIStore(s => s.openCart)
  const wishlistCount  = useWishlistStore(s => s.items.length)
  const { data: notifs = [] } = useNotifications()
  const unreadCount     = notifs.filter(n => !n.read).length
  const unreadMsgs      = useUnreadCount()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ,    setSearchQ]    = useState('')
  const navigate = useNavigate()

  const submitSearch = (e) => {
    e.preventDefault()
    const q = searchQ.trim()
    if (q) { navigate(`/search?q=${encodeURIComponent(q)}`); setSearchQ(''); setSearchOpen(false) }
  }

  return (
    <header className="sticky top-0 z-50"
            style={{ background: 'rgba(12,12,14,0.85)', backdropFilter: 'blur(24px) saturate(180%)',
                     borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">

        {/* Logo con partículas al hover */}
        <Link to="/" className="flex-shrink-0 mr-2">
          <Logo withParticles />
        </Link>

        {isAuthenticated ? (
          <>
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5 flex-1">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) => clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'text-brand-neon bg-brand-neon/8' : 'text-gray-400 hover:text-white hover:bg-white/5',
                  )}>
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Search bar desktop */}
            <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xs">
              <div className="relative w-full">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input
                  type="search" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Buscar productos, creators..."
                  className="input pl-9 py-2 text-sm h-9"
                />
              </div>
            </form>

            <div className="flex-1 md:hidden" />

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Mobile search */}
              <button className="btn-icon md:hidden" onClick={() => setSearchOpen(v => !v)}>
                {searchOpen ? <RiCloseLine size={18} /> : <RiSearchLine size={18} />}
              </button>

              {/* Wishlist */}
              <Link to="/wishlist" className="btn-icon relative">
                <RiHeartLine size={18} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold
                                   flex items-center justify-center text-brand-dark"
                        style={{ background: 'rgba(239,68,68,0.9)' }}>
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Chat */}
              <Link to="/chat" className="btn-icon relative">
                <RiMessage3Line size={18} />
                {unreadMsgs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold
                                   flex items-center justify-center text-brand-dark"
                        style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                    {unreadMsgs > 9 ? '9+' : unreadMsgs}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <Link to="/notifications" className="btn-icon relative">
                <RiBellLine size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 rounded-full text-[9px] font-bold
                                   flex items-center justify-center px-0.5 text-brand-dark"
                        style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button onClick={openCart} className="btn-icon relative">
                <RiShoppingBag3Line size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold
                                   flex items-center justify-center text-brand-dark"
                        style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Admin */}
              {user?.roles?.includes('admin') && (
                <Link to="/admin" className="btn-icon relative" title="Panel de admin">
                  <RiShieldUserLine size={18} style={{ color: '#f59e0b' }} />
                </Link>
              )}

              {/* Avatar */}
              <Link to="/profile" className="ml-1">
                <Avatar src={user?.avatar} name={user?.name} size="sm" />
              </Link>
            </div>

            {/* Mobile search bar */}
            {searchOpen && (
              <div className="absolute top-14 left-0 right-0 md:hidden px-4 py-3"
                   style={{ background: 'rgba(12,12,14,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <form onSubmit={submitSearch}>
                  <div className="relative">
                    <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input autoFocus type="search" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                           placeholder="Buscar..." className="input pl-9 py-2.5 text-sm" />
                  </div>
                </form>
              </div>
            )}
          </>
        ) : (
          /* ── No autenticado: Logo + búsqueda + botones ── */
          <>
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) => clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'text-brand-neon bg-brand-neon/8' : 'text-gray-400 hover:text-white hover:bg-white/5',
                  )}>
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Link to="/search" className="btn-icon md:hidden"><RiSearchLine size={18} /></Link>
              <Link to="/search" className="hidden md:flex btn-ghost text-sm py-1.5 px-3 gap-1.5">
                <RiSearchLine size={15} /> Buscar
              </Link>
              <Link to="/login"    className="btn-ghost text-sm py-1.5 px-4">Entrar</Link>
              <Link to="/register" className="btn-primary text-sm py-1.5 px-4">Registrarse</Link>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
