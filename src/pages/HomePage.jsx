import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  RiArrowRightLine, RiVideoLine, RiMoneyDollarCircleLine,
  RiShoppingBag3Line, RiShieldCheckLine, RiFlashlightLine,
  RiUploadCloudLine, RiWallet3Line, RiTruckLine, RiSparklingLine,
  RiUserStarLine, RiShareForwardLine,
} from 'react-icons/ri'
import ProductCard from '@/components/product/ProductCard'
import VideoCard from '@/components/video/VideoCard'
import Avatar from '@/components/ui/Avatar'
import { ProductCardSkeleton, VideoCardSkeleton } from '@/components/ui/Skeleton'
import { useFeaturedProducts } from '@/hooks/useProducts'
import { useFeedVideos } from '@/hooks/useVideos'
import { useTopCreators } from '@/hooks/useCreators'
import { useWallet } from '@/hooks/useWallet'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatNumber } from '@/utils/format'
import NumberTicker from '@/components/ui/NumberTicker'
import AnimatedShinyText from '@/components/ui/AnimatedShinyText'
import BorderBeam from '@/components/ui/BorderBeam'
import Meteors from '@/components/ui/Meteors'
import FlipWords from '@/components/ui/FlipWords'
import Marquee from '@/components/ui/Marquee'

const steps = [
  { icon: RiShoppingBag3Line, title: 'Comprá',    desc: 'Elegí cualquier producto del marketplace con comisión activa.' },
  { icon: RiVideoLine,        title: 'Grabá',      desc: 'Hacé tu review en video, mostrá tu experiencia real.' },
  { icon: RiFlashlightLine,   title: 'Ganá auto',  desc: 'Cada compra desde tu video te acredita comisión al instante.' },
]

const stats = [
  { num: 12.5, decimals: 1, suffix: 'K+',  label: 'Creadores activos',    beam: 6 },
  { num: 45,   decimals: 0, suffix: 'K+',  label: 'Productos',            beam: 8 },
  { num: 8.4,  decimals: 1, prefix: '$', suffix: 'M', label: 'Pagado en comisiones', beam: 7 },
  { num: 4.9,  decimals: 1, suffix: '★',  label: 'Rating promedio',       beam: 9 },
]

const QUICK_LINKS = [
  { to: '/feed',      icon: RiVideoLine,            label: 'Feed',       accent: '#a78bfa' },
  { to: '/market',    icon: RiShoppingBag3Line,     label: 'Tienda',     accent: '#60a5fa' },
  { to: '/upload',    icon: RiUploadCloudLine,      label: 'Subir',      accent: '#22c55e' },
  { to: '/wallet',    icon: RiWallet3Line,          label: 'Wallet',     accent: '#22c55e' },
  { to: '/creators',  icon: RiUserStarLine,         label: 'Creadores',  accent: '#c084fc' },
  { to: '/referrals', icon: RiShareForwardLine,     label: 'Referidos',  accent: '#34d399' },
  { to: '/earnings',  icon: RiMoneyDollarCircleLine, label: 'Ganancias', accent: '#22c55e' },
  { to: '/orders',    icon: RiTruckLine,            label: 'Pedidos',    accent: '#f87171' },
]

const stagger = {
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16,1,0.3,1] } },
}

function CreatorCard({ creator, rank }) {
  return (
    <Link to={`/profile/${creator.username}`}
          className="card-hover p-6 flex flex-col items-center text-center gap-4 block"
          style={{ minWidth: '220px' }}>
      <div className="relative">
        <Avatar src={creator.avatar} name={creator.name} size="xl" />
        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center
                         text-[11px] font-bold"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#0c0c0e' }}>
          {rank}
        </span>
      </div>
      <div>
        <p className="font-semibold">{creator.name}</p>
        <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>@{creator.username}</p>
        {creator.bio && <p className="text-xs mt-1.5 line-clamp-1" style={{ color: '#71717a' }}>{creator.bio}</p>}
      </div>
      <div className="w-full grid grid-cols-2 gap-2 pt-3"
           style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <p className="text-sm font-bold gradient-text">{formatCurrency(creator.totalEarned)}</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#52525b' }}>ganado</p>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: '#fafafa' }}>{formatNumber(creator.followers)}</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#52525b' }}>seguidores</p>
        </div>
      </div>
    </Link>
  )
}

/* ── Auth home — bento grid ─────────────────────────────────── */
function AuthHome({ user, featuredProducts, loadingProducts, latestVideos, loadingVideos }) {
  const { data: wallet } = useWallet()
  const balance = wallet?.paidOut ?? wallet?.balance ?? 0
  const pending = wallet?.pendingPayout ?? wallet?.pending ?? 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm" style={{ color: '#52525b' }}>Bienvenido de vuelta</p>
        <h1 className="text-2xl font-bold mt-0.5">
          Hola, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
      </motion.div>

      {/* ── Bento row 1: Wallet + Stats ──────── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>

        {/* Wallet — 2 cols en sm */}
        <Link to="/wallet"
              className="col-span-2 bento-featured p-5 relative overflow-hidden block"
              style={{ minHeight: '120px' }}>
          {/* Orb de fondo */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
               style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)' }} />
          <div className="relative">
            <p className="label mb-2">Saldo disponible</p>
            <p className="text-3xl font-bold gradient-text leading-none">{formatCurrency(balance)}</p>
            {pending > 0 && (
              <p className="text-xs mt-1.5" style={{ color: '#52525b' }}>
                +{formatCurrency(pending)} <span style={{ color: '#22c55e' }}>pendiente</span>
              </p>
            )}
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium"
                 style={{ color: '#22c55e' }}>
              Ver wallet <RiArrowRightLine size={13} />
            </div>
          </div>
        </Link>

        {/* Stats — 1 col, 2 rows */}
        <div className="col-span-2 sm:col-span-1 grid grid-cols-2 sm:grid-cols-1 gap-3">
          <div className="bento p-4">
            <p className="label mb-1">Comisiones</p>
            <p className="text-xl font-bold" style={{ color: '#22c55e' }}>
              {formatCurrency(wallet?.totalEarned ?? 0)}
            </p>
          </div>
          <div className="bento p-4">
            <p className="label mb-1">Este mes</p>
            <p className="text-xl font-bold" style={{ color: '#22c55e' }}>
              {formatCurrency(wallet?.monthEarned ?? 0)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Bento row 2: Quick access ────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <p className="label mb-3">Accesos rápidos</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
          {QUICK_LINKS.map(({ to, icon: Icon, label, accent }) => (
            <Link key={to} to={to}
                  className="bento flex flex-col items-center gap-2 py-3.5 px-2 group">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                   style={{ background: `${accent}12` }}>
                <Icon size={20} style={{ color: accent }} />
              </div>
              <span className="text-xs font-medium" style={{ color: '#71717a' }}>{label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Featured products ────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-end justify-between mb-3.5">
          <div>
            <p className="label mb-0.5">Marketplace</p>
            <h2 className="text-lg font-bold">
              Productos <span className="gradient-text">destacados</span>
            </h2>
          </div>
          <Link to="/market" className="btn-ghost text-xs flex items-center gap-1">
            Ver todos <RiArrowRightLine size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {loadingProducts && featuredProducts.length === 0
            ? [...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)
            : featuredProducts.slice(0, 6).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </motion.div>

      {/* ── Latest videos ────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-end justify-between mb-3.5">
          <div>
            <p className="label mb-0.5">Reviews</p>
            <h2 className="text-lg font-bold">
              Videos <span className="gradient-text">recientes</span>
            </h2>
          </div>
          <Link to="/feed" className="btn-ghost text-xs flex items-center gap-1">
            Ver feed <RiArrowRightLine size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {loadingVideos && latestVideos.length === 0
            ? [...Array(6)].map((_, i) => <VideoCardSkeleton key={i} />)
            : latestVideos.slice(0, 6).map(v => <VideoCard key={v.id} video={v} compact />)}
        </div>
      </motion.div>
    </div>
  )
}

/* ── Landing pública ─────────────────────────────────────────── */
export default function HomePage() {
  const { isAuthenticated, user }                      = useAuthStore()
  const { data: featData, isLoading: loadingProducts } = useFeaturedProducts()
  const { data: feedData, isLoading: loadingVideos }   = useFeedVideos()
  const { data: topCreators = [] }                     = useTopCreators(3)

  const featuredProducts = Array.isArray(featData)
    ? featData
    : (featData?.pages?.flatMap(p => p.data ?? p) ?? [])
  const latestVideos = feedData?.pages?.flatMap(p => p.data ?? p) ?? []

  if (isAuthenticated) {
    return <AuthHome user={user} featuredProducts={featuredProducts}
                     loadingProducts={loadingProducts} latestVideos={latestVideos}
                     loadingVideos={loadingVideos} />
  }

  return (
    <div className="min-h-screen overflow-hidden">

      {/* ── Hero ──────────────────────────────── */}
      <section className="relative pt-20 pb-28 px-4">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
        {/* Aurora orb — neón verde */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[600px] h-[400px] rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(ellipse, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.04) 45%, transparent 72%)', filter: 'blur(40px)' }} />
        {/* Meteors */}
        <Meteors count={14} />
        {/* Línea divisoria inferior */}
        <div className="absolute bottom-0 left-0 right-0 gradient-line" />

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16,1,0.3,1] }}>

            <div className="inline-flex items-center gap-2 badge-neon mb-6">
              <RiSparklingLine size={12} />
              El marketplace donde tu experiencia vale dinero
            </div>

            <h1 className="text-5xl md:text-7xl font-punk font-bold leading-[1.05] tracking-tight text-balance">
              Comprá, mostrá y ganá<br />
              <FlipWords
                className="gradient-text"
                words={['comisiones reales', 'en automático', 'mientras dormís', 'sin límites']}
                interval={2600}
              />
            </h1>

            <p className="mt-6 text-base md:text-lg leading-relaxed max-w-lg mx-auto"
               style={{ color: '#71717a' }}>
              El único marketplace donde tus videos de compra generan{' '}
              <AnimatedShinyText>comisiones automáticas</AnimatedShinyText>.{' '}
              Comprás, filmás y cobrás. El feed que labura por vos.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center mt-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16,1,0.3,1] }}>
            <Link to="/register" className="btn-primary text-base py-3.5 px-8">
              Empezar gratis
            </Link>
            <Link to="/feed" className="btn-secondary text-base py-3.5 px-8">
              Ver el feed <RiArrowRightLine size={15} />
            </Link>
          </motion.div>

          {/* Stats bento */}
          <motion.div
            className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}>
            {stats.map(({ num, decimals, prefix = '', suffix, label, beam }) => (
              <div key={label} className="bento py-4 px-3 text-center relative overflow-hidden">
                <BorderBeam duration={beam} />
                <p className="text-xl font-bold gradient-text">
                  <NumberTicker num={num} decimals={decimals} prefix={prefix} suffix={suffix} />
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ───────────────────────── */}
      <section className="py-24 px-4" style={{ background: '#0e0e12' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="label mb-3">Simple y automático</p>
            <h2 className="text-4xl font-punk font-bold">
              Cómo <span className="gradient-text">funciona</span>
            </h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-4"
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={i} variants={item} className="bento-featured p-7 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                       style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)' }}>
                    <Icon size={22} style={{ color: '#22c55e' }} />
                  </div>
                  <span className="font-punk text-6xl font-bold"
                        style={{ color: 'rgba(255,255,255,0.04)', lineHeight: 1 }}>
                    0{i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#71717a' }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Featured products ──────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="flex items-end justify-between mb-8"
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <div>
              <p className="label mb-1.5">Más vendidos</p>
              <h2 className="text-3xl font-punk font-bold">
                Productos <span className="gradient-text">destacados</span>
              </h2>
            </div>
            <Link to="/market" className="btn-ghost text-sm flex items-center gap-1">
              Ver todos <RiArrowRightLine size={14} />
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {loadingProducts && featuredProducts.length === 0
              ? [...Array(6)].map((_, i) => <motion.div key={i} variants={item}><ProductCardSkeleton /></motion.div>)
              : featuredProducts.map(p => (
                  <motion.div key={p.id} variants={item}>
                    <ProductCard product={p} />
                  </motion.div>
                ))}
          </motion.div>
        </div>
      </section>

      {/* ── Latest videos ──────────────────────── */}
      <section className="py-24 px-4" style={{ background: '#0e0e12' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="flex items-end justify-between mb-8"
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <div>
              <p className="label mb-1.5">Reviews reales</p>
              <h2 className="text-3xl font-punk font-bold">
                Videos <span className="gradient-text">recientes</span>
              </h2>
            </div>
            <Link to="/feed" className="btn-ghost text-sm flex items-center gap-1">
              Ver feed <RiArrowRightLine size={14} />
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {loadingVideos && latestVideos.length === 0
              ? [...Array(6)].map((_, i) => <motion.div key={i} variants={item}><VideoCardSkeleton /></motion.div>)
              : latestVideos.slice(0, 6).map(v => (
                  <motion.div key={v.id} variants={item}>
                    <VideoCard video={v} compact />
                  </motion.div>
                ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features bento ─────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <h2 className="text-4xl font-punk font-bold">
              Por qué <span className="gradient-text">Cannapont</span>
            </h2>
          </motion.div>

          {/* Bento grid de features */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>

            {/* Feature grande — 2 cols */}
            <motion.div variants={item} className="col-span-2 bento-featured p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
                   style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                     style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)' }}>
                  <RiFlashlightLine size={28} style={{ color: '#22c55e' }} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Comisiones al instante</h3>
                <p className="text-base leading-relaxed max-w-md" style={{ color: '#71717a' }}>
                  Sin esperas. El pago se acredita automáticamente en tu wallet cuando alguien compra desde tu video. Ganá mientras dormís.
                </p>
              </div>
            </motion.div>

            {/* Feature chico */}
            <motion.div variants={item} className="bento p-7 relative overflow-hidden">
              <BorderBeam duration={9} colorFrom="#60a5fa" colorTo="#8b5cf6" />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full"
                   style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%)' }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                   style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}>
                <RiShieldCheckLine size={22} style={{ color: '#60a5fa' }} />
              </div>
              <h3 className="font-semibold mb-2">100% seguro</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#71717a' }}>Pagos protegidos y datos cifrados.</p>
            </motion.div>

            {/* Feature chico amber */}
            <motion.div variants={item} className="bento p-7 relative overflow-hidden">
              <BorderBeam duration={7} colorFrom="#22c55e" colorTo="#4ade80" />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full"
                   style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)' }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                   style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)' }}>
                <RiMoneyDollarCircleLine size={22} style={{ color: '#22c55e' }} />
              </div>
              <h3 className="font-semibold mb-2">Sin límite de ingresos</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#71717a' }}>Un video puede generar comisiones para siempre.</p>
            </motion.div>

            {/* Feature chico purple */}
            <motion.div variants={item} className="bento p-7 relative overflow-hidden">
              <BorderBeam duration={11} colorFrom="#a78bfa" colorTo="#8b5cf6" />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full"
                   style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)' }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                   style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
                <RiVideoLine size={22} style={{ color: '#a78bfa' }} />
              </div>
              <h3 className="font-semibold mb-2">Comunidad de creadores</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#71717a' }}>12.500+ creadores ya están ganando.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Top creators ───────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden" style={{ background: '#0e0e12' }}>
        <Meteors count={8} />
        <div className="max-w-4xl mx-auto relative">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>
            <p className="label mb-3">Comunidad</p>
            <h2 className="text-4xl font-punk font-bold">
              Top <span className="gradient-text">creadores</span>
            </h2>
            <Link to="/creators" className="btn-ghost text-sm flex items-center gap-1 mt-3 mx-auto w-fit">
              Ver ranking <RiArrowRightLine size={13} />
            </Link>
          </motion.div>

          {topCreators.length > 3 ? (
            <Marquee speed={38} gap={16}>
              {topCreators.map((creator, i) => (
                <CreatorCard key={creator.id} creator={creator} rank={i + 1} />
              ))}
            </Marquee>
          ) : (
            <motion.div
              className="grid sm:grid-cols-3 gap-4"
              variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              {topCreators.map((creator, i) => (
                <motion.div key={creator.id} variants={item}>
                  <CreatorCard creator={creator} rank={i + 1} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── CTA final ──────────────────────────── */}
      <section className="py-28 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
        <Meteors count={10} />
        <div className="absolute top-0 left-0 right-0 gradient-line" />

        <motion.div
          className="relative max-w-2xl mx-auto text-center space-y-6"
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}>

          <div className="inline-flex items-center gap-2 badge-amber mb-2">
            <RiSparklingLine size={12} /> Registro 100% gratis
          </div>

          <h2 className="text-4xl md:text-6xl font-punk font-bold leading-tight text-balance">
            ¿Listo para <span className="gradient-text">ganar</span>?
          </h2>
          <p className="text-base" style={{ color: '#71717a' }}>
            Sin tarjeta. Sin límites. Empezá a monetizar hoy.
          </p>
          <Link to="/register" className="btn-primary text-lg py-4 px-12 inline-flex shadow-neon">
            Crear mi cuenta gratis
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
