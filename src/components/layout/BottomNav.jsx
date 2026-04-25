import { NavLink } from 'react-router-dom'
import {
  RiHomeLine, RiHome2Fill,
  RiVideoLine, RiVideoFill,
  RiStoreLine, RiStore2Fill,
  RiUploadCloudLine,
  RiMessage3Line, RiMessage3Fill,
  RiUserLine, RiUserFill,
} from 'react-icons/ri'
import { useAuthStore } from '@/store/authStore'
import { useUnreadCount } from '@/hooks/useChat'
import clsx from 'clsx'

const baseItems = [
  { to: '/',       icon: RiHomeLine,     activeIcon: RiHome2Fill,    label: 'Inicio' },
  { to: '/feed',   icon: RiVideoLine,    activeIcon: RiVideoFill,    label: 'Feed' },
  { to: '/market', icon: RiStoreLine,    activeIcon: RiStore2Fill,   label: 'Tienda' },
]

const authItems = [
  { to: '/chat',    icon: RiMessage3Line, activeIcon: RiMessage3Fill, label: 'Chat',  badge: true },
  { to: '/profile', icon: RiUserLine,     activeIcon: RiUserFill,     label: 'Perfil' },
]

export default function BottomNav() {
  const { isAuthenticated } = useAuthStore()
  const unreadMsgs          = useUnreadCount()
  const items = isAuthenticated ? [...baseItems, ...authItems] : baseItems

  if (!isAuthenticated) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom"
         style={{ background: 'rgba(12,12,14,0.92)', backdropFilter: 'blur(28px) saturate(180%)',
                  borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-around h-16 px-1 relative">

        {/* Upload FAB in center */}
        {isAuthenticated && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-5">
            <NavLink to="/upload"
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-neon
                         transition-transform active:scale-90"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #a855f7 100%)', boxShadow: '0 4px 20px rgba(245,158,11,0.25)' }}>
              <RiUploadCloudLine size={22} className="text-brand-dark" />
            </NavLink>
          </div>
        )}

        {items.map(({ to, icon: Icon, activeIcon: ActiveIcon, label, badge }, idx) => {
          // leave gap in middle for FAB
          const isMidGap = isAuthenticated && idx === Math.floor(items.length / 2)
          return (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative',
                isMidGap && 'invisible pointer-events-none w-12',
                isActive ? 'text-brand-neon' : 'text-gray-600 hover:text-gray-400',
              )}>
              {({ isActive }) => (
                <>
                  <div className="relative">
                    {isActive ? <ActiveIcon size={22} /> : <Icon size={22} />}
                    {badge && unreadMsgs > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold
                                       flex items-center justify-center"
                            style={{ background: '#f59e0b', color: '#0c0c0e' }}>
                        {unreadMsgs > 9 ? '9+' : unreadMsgs}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
