import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiBellLine, RiCheckDoubleLine,
  RiMoneyDollarCircleLine, RiTruckLine,
  RiUserAddLine, RiShoppingBag3Line,
  RiDeleteBin6Line, RiCloseLine,
} from 'react-icons/ri'
import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/useNotifications'
import { useNotifStore } from '@/store/notifStore'
import { timeAgo } from '@/utils/format'
import clsx from 'clsx'

const TYPE_META = {
  commission: { icon: RiMoneyDollarCircleLine, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Comisiones' },
  sale:       { icon: RiShoppingBag3Line,      color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  label: 'Ventas'     },
  order:      { icon: RiTruckLine,             color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',  label: 'Pedidos'    },
  follower:   { icon: RiUserAddLine,           color: '#c084fc', bg: 'rgba(139,92,246,0.1)',  label: 'Seguidores' },
}

const FILTERS = [
  { id: 'all',        label: 'Todas'      },
  { id: 'unread',     label: 'No leídas'  },
  { id: 'commission', label: 'Comisiones' },
  { id: 'order',      label: 'Pedidos'    },
  { id: 'follower',   label: 'Seguidores' },
]

export default function NotificationsPage() {
  const navigate                     = useNavigate()
  const { data: notifications = [] } = useNotifications()
  const { mutate: markRead }         = useMarkRead()
  const { mutate: markAllRead }      = useMarkAllRead()
  const remove                       = useNotifStore(s => s.remove)
  const clearAll                     = useNotifStore(s => s.clearAll)
  const [filter, setFilter]          = useState('all')

  const unread = notifications.filter(n => !n.read).length

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'all')    return true
    return n.type === filter
  })

  const handleClick = (notif) => {
    markRead(notif.id)
    if (notif.actionUrl) navigate(notif.actionUrl)
  }

  const handleDismiss = (e, id) => {
    e.stopPropagation()
    remove(id)
  }

  return (
    <motion.div
      className="max-w-xl mx-auto px-4 py-8 space-y-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="label mb-1">Centro de actividad</p>
          <h1 className="section-title" style={{ fontSize: '1.75rem' }}>
            Notifica<span className="neon-text">ciones</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllRead}
                    className="btn-ghost text-xs flex items-center gap-1.5 border border-brand-border">
              <RiCheckDoubleLine size={14} /> Leído todo
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll}
                    className="btn-ghost text-xs flex items-center gap-1.5 border border-brand-border transition-colors"
                    style={{ color: '#4b5563' }}>
              <RiDeleteBin6Line size={13} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {notifications.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {FILTERS.map(f => {
            const count = f.id === 'unread'
              ? unread
              : f.id === 'all'
              ? notifications.length
              : notifications.filter(n => n.type === f.id).length
            if (f.id !== 'all' && f.id !== 'unread' && count === 0) return null
            const active = filter === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 overflow-hidden"
                style={active
                  ? { color: '#0c0c0e' }
                  : { background: '#1c1c1f', border: '1px solid #27272a', color: '#71717a' }}
              >
                {active && (
                  <motion.span
                    layoutId="notif-filter-bg"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: '#f59e0b' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {f.label}
                  <span className={clsx(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    active ? 'bg-black/20 text-brand-dark' : 'bg-white/8 text-gray-500',
                  )}>
                    {count}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Lista */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-center py-20 space-y-3"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                 style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.1)' }}>
              <RiBellLine size={28} style={{ color: 'rgba(245,158,11,0.3)' }} />
            </div>
            <p className="text-sm" style={{ color: '#4b5563' }}>
              {filter === 'unread' ? 'No tenés notificaciones sin leer' : 'No hay notificaciones en esta categoría'}
            </p>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')}
                      className="text-xs hover:underline" style={{ color: '#f59e0b' }}>
                Ver todas
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="card overflow-hidden"
          >
            <AnimatePresence initial={false}>
              {filtered.map((notif, i) => {
                const meta = TYPE_META[notif.type] ?? TYPE_META.commission
                const Icon = meta.icon
                const isLast = i === filtered.length - 1

                return (
                  <motion.button
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.2 } }}
                    exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                    onClick={() => handleClick(notif)}
                    className={clsx(
                      'w-full flex items-start gap-3 p-4 text-left relative group',
                      !notif.read && 'bg-brand-neon/[0.03]',
                    )}
                    style={!isLast ? { borderBottom: '1px solid #27272a' } : {}}
                  >
                    {/* Unread bar */}
                    {!notif.read && (
                      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full"
                           style={{ background: '#f59e0b' }} />
                    )}

                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                         style={{ background: meta.bg }}>
                      <Icon size={17} style={{ color: meta.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{notif.title}</p>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: '#f59e0b' }} />
                        )}
                      </div>
                      <p className="text-xs leading-relaxed mt-0.5" style={{ color: '#52525b' }}>{notif.body}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[11px]" style={{ color: '#3d3d42' }}>
                          {notif.time ?? (notif.createdAt ? timeAgo(notif.createdAt) : '')}
                        </p>
                        {notif.actionUrl && (
                          <span className="text-[10px] font-medium" style={{ color: '#f59e0b' }}>
                            Ver →
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dismiss */}
                    <motion.button
                      onClick={(e) => handleDismiss(e, notif.id)}
                      whileTap={{ scale: 0.85 }}
                      className="absolute right-3 top-3.5 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg
                                 flex items-center justify-center transition-opacity"
                      style={{ color: '#4b5563' }}>
                      <RiCloseLine size={14} />
                    </motion.button>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {unread === 0 && notifications.length > 0 && filter === 'all' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs"
          style={{ color: '#3d3d42' }}
        >
          Todo al día ✓
        </motion.p>
      )}
    </motion.div>
  )
}
