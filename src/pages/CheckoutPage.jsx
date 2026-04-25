import { useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiArrowLeftLine, RiMapPinLine, RiShoppingBag3Line,
  RiCheckLine, RiLockLine, RiArrowRightLine, RiAddLine,
  RiBookmarkLine,
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import { useMutation } from 'react-query'
import { useCartStore } from '@/store/cartStore'
import { useAddressStore } from '@/store/addressStore'
import { mpApi } from '@/services/api'
import { formatCurrency } from '@/utils/format'
import Spinner from '@/components/ui/Spinner'
import clsx from 'clsx'
import { useEffect } from 'react'

const STEPS = ['Dirección', 'Resumen', 'Pago']

const PROVINCES = ['Buenos Aires','CABA','Córdoba','Santa Fe','Mendoza',
  'Tucumán','Entre Ríos','Salta','Misiones','Neuquén','Chaco','Corrientes',
  'Santiago del Estero','San Juan','Jujuy','Río Negro','Formosa','Chubut',
  'San Luis','Catamarca','La Rioja','La Pampa','Santa Cruz','Tierra del Fuego',
]

const stepVariants = {
  enter:  (dir) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
}

export default function CheckoutPage() {
  const [step,    setStep]    = useState(0)
  const [direction, setDir]  = useState(1)
  const [address, setAddress] = useState(null)
  const [saveAddr, setSaveAddr] = useState(false)
  const [selectedSaved, setSelectedSaved] = useState(null)
  const { items, clearCart, referrerId } = useCartStore()
  const { addresses, add: addAddress } = useAddressStore()
  const navigate   = useNavigate()
  const [searchParams] = useSearchParams()
  const total = items.reduce((acc, i) => acc + i.product.price * i.qty, 0)
  const count = items.reduce((acc, i) => acc + i.qty, 0)

  const goTo = (next) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  const { mutate: startCheckout, isLoading: loading } = useMutation(
    (data) => mpApi.createCheckout(data),
    {
      onSuccess: ({ initPoint }) => {
        clearCart()
        window.location.href = initPoint
      },
      onError: (err) => {
        toast.error(err?.response?.data?.error ?? 'Error al iniciar el pago')
      },
    },
  )

  const paymentStatus = searchParams.get('payment')
  useEffect(() => {
    if (paymentStatus === 'failed') toast.error('El pago fue rechazado. Intentá de nuevo.')
  }, [paymentStatus])

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  if (items.length === 0) {
    return (
      <motion.div
        className="max-w-lg mx-auto px-4 py-20 text-center space-y-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <RiShoppingBag3Line size={48} className="mx-auto opacity-20" />
        <p className="font-semibold" style={{ color: '#4b5563' }}>Tu carrito está vacío</p>
        <Link to="/market" className="btn-primary inline-flex gap-2">
          Ir al marketplace <RiArrowRightLine size={16} />
        </Link>
      </motion.div>
    )
  }

  const handleSelectSaved = (addr) => {
    setSelectedSaved(addr.id)
    reset({
      fullName: addr.fullName,
      street:   addr.street,
      city:     addr.city,
      zip:      addr.zip,
      province: addr.province,
      phone:    addr.phone,
      notes:    addr.notes ?? '',
    })
  }

  const onAddressSubmit = (data) => {
    if (saveAddr) addAddress(data)
    setAddress(data)
    goTo(1)
  }

  const handleStartPayment = () => {
    startCheckout({
      items:      items.map(i => ({ productId: i.product.id, qty: i.qty })),
      address,
      referrerId: referrerId ?? undefined,
    })
  }

  return (
    <motion.div
      className="max-w-lg mx-auto px-4 py-8 space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Back */}
      <button onClick={() => step === 0 ? navigate(-1) : goTo(step - 1)}
              className="btn-ghost -ml-2 flex items-center gap-1.5 w-fit text-sm">
        <RiArrowLeftLine size={16} />
        {step === 0 ? 'Volver' : STEPS[step - 1]}
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all overflow-hidden"
                   style={i < step
                     ? { background: '#f59e0b', color: '#0c0c0e' }
                     : i === step
                       ? { background: 'rgba(245,158,11,0.2)', border: '1px solid #f59e0b', color: '#f59e0b' }
                       : { background: '#27272a', color: '#4b5563' }}>
                <AnimatePresence mode="wait" initial={false}>
                  {i < step ? (
                    <motion.span key="check"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}>
                      <RiCheckLine size={13} />
                    </motion.span>
                  ) : (
                    <motion.span key="num"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}>
                      {i + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-xs font-medium hidden sm:block"
                    style={{ color: i === step ? '#fff' : '#4b5563' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px w-8 overflow-hidden rounded-full" style={{ background: '#27272a' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: '#f59e0b', transformOrigin: 'left' }}
                  animate={{ scaleX: i < step ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >

          {/* ── PASO 0: Dirección ─────────────────────────── */}
          {step === 0 && (
            <div className="card p-5 space-y-5">
              <div className="flex items-center gap-2">
                <RiMapPinLine size={18} style={{ color: '#f59e0b' }} />
                <h2 className="font-semibold">Dirección de entrega</h2>
              </div>

              {addresses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs label">Mis direcciones guardadas</p>
                  <div className="space-y-2">
                    {addresses.map(addr => (
                      <motion.button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectSaved(addr)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={clsx(
                          'w-full text-left rounded-xl p-3 border transition-all',
                          selectedSaved === addr.id
                            ? 'border-amber-500/60 bg-amber-500/8'
                            : 'border-brand-border bg-brand-surface hover:border-amber-500/30',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{addr.fullName}</p>
                            <p className="text-xs mt-0.5 truncate" style={{ color: '#52525b' }}>
                              {addr.street}, {addr.city}, {addr.province}
                            </p>
                          </div>
                          {selectedSaved === addr.id && (
                            <RiCheckLine size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 h-px" style={{ background: '#27272a' }} />
                    <span className="text-xs flex items-center gap-1" style={{ color: '#4b5563' }}>
                      <RiAddLine size={11} /> O completá una nueva
                    </span>
                    <div className="flex-1 h-px" style={{ background: '#27272a' }} />
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onAddressSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="label block mb-1.5">Nombre completo</label>
                    <input {...register('fullName', { required: 'Requerido' })}
                           placeholder="Sofía Punk" className="input" />
                    {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="label block mb-1.5">Calle y número</label>
                    <input {...register('street', { required: 'Requerido' })}
                           placeholder="Av. Corrientes 1234" className="input" />
                    {errors.street && <p className="text-red-400 text-xs mt-1">{errors.street.message}</p>}
                  </div>

                  <div>
                    <label className="label block mb-1.5">Ciudad</label>
                    <input {...register('city', { required: 'Requerido' })}
                           placeholder="Buenos Aires" className="input" />
                    {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city.message}</p>}
                  </div>

                  <div>
                    <label className="label block mb-1.5">Código postal</label>
                    <input {...register('zip', { required: 'Requerido' })}
                           placeholder="1043" className="input" />
                    {errors.zip && <p className="text-red-400 text-xs mt-1">{errors.zip.message}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="label block mb-1.5">Provincia</label>
                    <select {...register('province', { required: 'Requerido' })} className="input">
                      <option value="">Seleccioná...</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors.province && <p className="text-red-400 text-xs mt-1">{errors.province.message}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="label block mb-1.5">Teléfono de contacto</label>
                    <input {...register('phone', { required: 'Requerido' })}
                           placeholder="+54 11 1234-5678" className="input" type="tel" />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="label block mb-1.5">Piso / Depto / Referencias (opcional)</label>
                    <input {...register('notes')}
                           placeholder="4° B, timbre Punk" className="input" />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
                  <div
                    onClick={() => setSaveAddr(v => !v)}
                    className={clsx(
                      'w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0',
                      saveAddr ? 'border-amber-500 bg-amber-500/20' : 'border-brand-border bg-transparent',
                    )}
                  >
                    {saveAddr && <RiCheckLine size={11} style={{ color: '#f59e0b' }} />}
                  </div>
                  <span className="text-sm flex items-center gap-1.5" style={{ color: '#71717a' }}>
                    <RiBookmarkLine size={13} />
                    Guardar esta dirección para próximas compras
                  </span>
                </label>

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full py-3.5 gap-2">
                  Continuar al resumen <RiArrowRightLine size={16} />
                </motion.button>
              </form>
            </div>
          )}

          {/* ── PASO 1: Resumen ───────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="card p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <RiMapPinLine size={16} style={{ color: '#f59e0b' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs label mb-0.5">Entrega en</p>
                  <p className="text-sm font-medium">{address?.fullName}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>
                    {address?.street}, {address?.city}, {address?.province} ({address?.zip})
                  </p>
                </div>
                <button onClick={() => goTo(0)} className="text-xs flex-shrink-0 font-medium"
                        style={{ color: '#f59e0b' }}>
                  Editar
                </button>
              </div>

              <div className="card overflow-hidden">
                <div className="p-4" style={{ borderBottom: '1px solid #27272a' }}>
                  <h2 className="font-semibold">
                    Tu pedido{' '}
                    <span className="text-xs font-normal" style={{ color: '#4b5563' }}>
                      ({count} {count === 1 ? 'producto' : 'productos'})
                    </span>
                  </h2>
                </div>
                {items.map(({ product, qty }) => (
                  <div key={product.id} className="flex items-center gap-3 p-4"
                       style={{ borderBottom: '1px solid #27272a' }}>
                    <img src={product.imageUrl} alt={product.name}
                         className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>Cantidad: {qty}</p>
                      {referrerId && product.commissionPct > 0 && (
                        <span className="badge-neon mt-1 inline-flex" style={{ fontSize: '9px' }}>
                          Comisión activa +{product.commissionPct}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold flex-shrink-0">{formatCurrency(product.price * qty)}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center p-4">
                  <span className="text-sm" style={{ color: '#52525b' }}>Total</span>
                  <span className="text-lg font-bold">{formatCurrency(total)}</span>
                </div>
              </div>

              <motion.button
                onClick={() => goTo(2)}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full py-3.5 gap-2">
                Ir a pagar <RiArrowRightLine size={16} />
              </motion.button>
            </div>
          )}

          {/* ── PASO 2: Pago ─────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <RiLockLine size={16} style={{ color: '#f59e0b' }} />
                  <h2 className="font-semibold">Pago seguro</h2>
                </div>

                <div className="rounded-xl p-4 space-y-2" style={{ background: '#18181c', border: '1px solid #27272a' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#52525b' }}>Subtotal ({count} {count === 1 ? 'producto' : 'productos'})</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#52525b' }}>Envío</span>
                    <span className="text-brand-neon font-medium">Gratis</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2" style={{ borderTop: '1px solid #27272a' }}>
                    <span>Total</span>
                    <span className="text-lg">{formatCurrency(total)}</span>
                  </div>
                </div>

                <motion.button
                  onClick={handleStartPayment}
                  disabled={loading}
                  whileHover={loading ? {} : { scale: 1.01 }}
                  whileTap={loading ? {} : { scale: 0.98 }}
                  className="btn-primary w-full py-4 text-base gap-3"
                  style={{ background: '#009ee3', boxShadow: '0 0 20px rgba(0,158,227,0.35)' }}
                >
                  {loading ? (
                    <><Spinner size="sm" /> Procesando...</>
                  ) : (
                    <>
                      <img src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png"
                           alt="MercadoPago" className="h-5 object-contain brightness-0 invert" />
                      Pagar con MercadoPago
                    </>
                  )}
                </motion.button>

                <p className="text-center text-xs flex items-center justify-center gap-1.5" style={{ color: '#3d3d42' }}>
                  <RiLockLine size={12} />
                  Pago 100% seguro · Datos cifrados por MercadoPago
                </p>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
