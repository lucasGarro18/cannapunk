import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiShareForwardLine, RiCheckLine, RiUserAddLine,
  RiMoneyDollarCircleLine, RiLinkM, RiVideoLine,
  RiArrowRightLine, RiGiftLine,
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import Avatar from '@/components/ui/Avatar'
import StatCard from '@/components/ui/StatCard'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from 'react-query'
import { referralsApi } from '@/services/api'
import { formatCurrency, formatNumber } from '@/utils/format'

const referred_FALLBACK = []

function useReferrals() {
  return useQuery(
    ['referrals'],
    async () => {
      try { return await referralsApi.getSummary() }
      catch (err) {
        if (!err.response) return { totalReferred: 0, totalPurchases: 0, totalEarned: 0, referred: referred_FALLBACK }
        throw err
      }
    },
    { initialData: { totalReferred: 0, totalPurchases: 0, totalEarned: 0, referred: referred_FALLBACK } },
  )
}

const STEPS = [
  { icon: RiLinkM,              title: 'Compartí tu link',     desc: 'Mandáselo a amigos, familia o seguidores.' },
  { icon: RiUserAddLine,        title: 'Se registran',          desc: 'Crean su cuenta gratis usando tu enlace.' },
  { icon: RiMoneyDollarCircleLine, title: 'Vos ganás',          desc: 'Recibís el 5% de sus primeras 3 compras.' },
]

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const fadeUp  = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16,1,0.3,1] } },
}

export default function ReferralsPage() {
  const { user }            = useAuthStore()
  const { data: refData }   = useReferrals()
  const [copied, setCopied] = useState(false)

  const referralLink   = `${window.location.origin}/register?ref=${user?.username ?? 'tu-usuario'}`
  const totalEarned    = refData?.totalEarned    ?? 0
  const totalReferred  = refData?.totalReferred  ?? 0
  const totalPurchases = refData?.totalPurchases ?? 0
  const referred       = refData?.referred       ?? []

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Link copiado al portapapeles')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Unite a CannaPunk',
          text: `Comprá, mostrá y ganá comisiones automáticas. Usá mi link:`,
          url: referralLink,
        })
      } else {
        await handleCopy()
      }
    } catch { /* cancelado */ }
  }

  return (
    <motion.div
      className="max-w-xl mx-auto px-4 py-8 space-y-6"
      variants={stagger} initial="hidden" animate="show"
    >

      {/* Header */}
      <motion.div variants={fadeUp}>
        <p className="label mb-1">Programa de referidos</p>
        <h1 className="section-title" style={{ fontSize: '1.75rem' }}>
          Invitá y <span className="neon-text">ganá</span>
        </h1>
        <p className="text-sm mt-1" style={{ color: '#52525b' }}>
          Compartí tu link único y ganá el 5% de las primeras compras de cada referido.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div className="grid grid-cols-3 gap-3" variants={stagger}>
        <motion.div variants={fadeUp}>
          <StatCard label="Referidos"  value={totalReferred}         icon={RiUserAddLine}            color="purple" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Compras"    value={totalPurchases}        icon={RiVideoLine}              color="blue"   />
        </motion.div>
        <motion.div variants={fadeUp}>
          <StatCard label="Ganado"     value={formatCurrency(totalEarned)} icon={RiMoneyDollarCircleLine} color="neon" />
        </motion.div>
      </motion.div>

      {/* Link card */}
      <motion.div variants={fadeUp}
                  className="card p-5 space-y-4"
                  style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.02)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background: 'rgba(245,158,11,0.1)' }}>
            <RiLinkM size={16} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <p className="text-sm font-semibold">Tu link de referido</p>
            <p className="text-xs text-gray-500">Único e intransferible</p>
          </div>
        </div>

        {/* URL display */}
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#18181c', border: '1px solid #27272a' }}>
          <p className="flex-1 text-xs font-mono truncate" style={{ color: '#a1a1aa' }}>
            {referralLink}
          </p>
          <motion.button onClick={handleCopy}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
                  style={copied
                    ? { background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }
                    : { background: 'rgba(255,255,255,0.06)', color: '#d4d4d8' }}>
            <AnimatePresence mode="wait" initial={false}>
              {copied
                ? <motion.span key="check" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}><RiCheckLine size={13} /></motion.span>
                : <motion.span key="link"  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}><RiLinkM size={13} /></motion.span>
              }
            </AnimatePresence>
            {copied ? 'Copiado' : 'Copiar'}
          </motion.button>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2.5">
          <motion.button onClick={handleShare} whileTap={{ scale: 0.97 }}
                  className="btn-primary flex-1 py-3 gap-2 text-sm">
            <RiShareForwardLine size={16} /> Compartir link
          </motion.button>
          <Link to="/upload"
                className="btn-secondary flex-1 py-3 gap-2 text-sm flex items-center justify-center">
            <RiVideoLine size={16} /> Crear video
          </Link>
        </div>
      </motion.div>

      {/* Cómo funciona */}
      <motion.div variants={fadeUp} className="space-y-3">
        <h2 className="font-semibold text-sm text-gray-400">Cómo funciona</h2>
        <motion.div className="grid grid-cols-3 gap-3" variants={stagger}>
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={i} variants={fadeUp}
                        whileHover={{ y: -2, transition: { duration: 0.15 } }}
                        className="card p-4 space-y-3 text-center">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto"
                   style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <Icon size={19} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p className="text-xs font-semibold">{title}</p>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Referred users list */}
      <motion.div variants={fadeUp} className="card overflow-hidden">
        <div className="p-4 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiGiftLine size={15} className="text-brand-neon" />
            <h2 className="font-semibold text-sm">Mis referidos ({totalReferred})</h2>
          </div>
          {totalEarned > 0 && (
            <span className="text-xs font-semibold neon-text">+{formatCurrency(totalEarned)} ganados</span>
          )}
        </div>

        {referred.length === 0 ? (
          <div className="text-center py-12 px-6 space-y-3">
            <RiUserAddLine size={28} className="mx-auto text-gray-700" />
            <p className="text-sm text-gray-600">Todavía no referiste a nadie</p>
            <p className="text-xs text-gray-700">Compartí tu link y empezá a ganar</p>
          </div>
        ) : (
          <motion.div className="divide-y divide-brand-border" variants={stagger}>
            {referred.map(ref => (
              <motion.div key={ref.id} variants={fadeUp} className="flex items-center gap-3 p-4">
                <Avatar src={ref.avatar} name={ref.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ref.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    @{ref.username} · {ref.purchases} compra{ref.purchases !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold neon-text">+{formatCurrency(ref.earned)}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {new Date(ref.joinedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Bonus tier */}
      <motion.div variants={fadeUp} className="card p-5 space-y-3"
           style={{ border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.03)' }}>
        <div className="flex items-center gap-2">
          <RiGiftLine size={16} style={{ color: '#a78bfa' }} />
          <p className="font-semibold text-sm">Bonus por volumen</p>
        </div>
        <div className="space-y-2">
          {[
            { label: '5+ referidos',  bonus: '+1%',  done: totalReferred >= 5  },
            { label: '10+ referidos', bonus: '+2%',  done: totalReferred >= 10 },
            { label: '25+ referidos', bonus: '+3%',  done: totalReferred >= 25 },
          ].map(tier => (
            <div key={tier.label} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                   style={{ background: tier.done ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${tier.done ? '#f59e0b' : '#27272a'}` }}>
                {tier.done && <RiCheckLine size={11} style={{ color: '#f59e0b' }} />}
              </div>
              <p className="text-xs flex-1" style={{ color: tier.done ? '#fafafa' : '#52525b' }}>
                {tier.label}
              </p>
              <span className="text-xs font-bold" style={{ color: tier.done ? '#f59e0b' : '#3f3f46' }}>
                {tier.bonus} comisión
              </span>
            </div>
          ))}
        </div>
        <Link to="/earnings" className="text-xs flex items-center gap-1 mt-1"
              style={{ color: '#a78bfa' }}>
          Ver mis ganancias <RiArrowRightLine size={11} />
        </Link>
      </motion.div>
    </motion.div>
  )
}
