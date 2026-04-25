import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiUserLine, RiLockLine, RiBankLine, RiArrowLeftLine,
  RiCameraLine, RiMotorbikeLine,
  RiStoreLine, RiVideoLine, RiShoppingBag3Line,
  RiMapPinLine, RiDeleteBin6Line, RiCheckLine, RiAddLine,
  RiWalletLine, RiCoinLine, RiLoader4Line,
} from 'react-icons/ri'
import toast from 'react-hot-toast'
import Avatar from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/authStore'
import { useAddressStore } from '@/store/addressStore'
import { useLogout, useUpdateUser, useChangePassword } from '@/hooks/useAuth'
import { authApi } from '@/services/api'
import { useMutation } from 'react-query'
import clsx from 'clsx'

const ROLE_META = {
  buyer:    { label: 'Comprador',  icon: RiShoppingBag3Line, color: '#f59e0b' },
  creator:  { label: 'Creador',    icon: RiVideoLine,        color: '#c084fc' },
  seller:   { label: 'Vendedor',   icon: RiStoreLine,        color: '#60a5fa' },
  delivery: { label: 'Repartidor', icon: RiMotorbikeLine,    color: '#fbbf24' },
}

const ALL_ROLES = ['buyer', 'creator', 'seller', 'delivery']

const TABS = [
  { id: 'profile',   label: 'Perfil',      icon: RiUserLine    },
  { id: 'roles',     label: 'Roles',       icon: RiStoreLine   },
  { id: 'addresses', label: 'Direcciones', icon: RiMapPinLine  },
  { id: 'payout',    label: 'Cobros',      icon: RiBankLine    },
  { id: 'account',   label: 'Cuenta',      icon: RiLockLine    },
]

export default function SettingsPage() {
  const navigate      = useNavigate()
  const { user }      = useAuthStore()
  const logout        = useLogout()
  const { mutate: updateUser, isLoading: saving } = useUpdateUser()
  const { mutate: changePwd, isLoading: savingPwd } = useChangePassword()
  const { addresses, defaultId, remove: removeAddress, setDefault } = useAddressStore()
  const [tab, setTab] = useState('profile')
  const avatarInputRef = useRef(null)

  const updateUserStore = useAuthStore(s => s.updateUser)

  const { mutate: uploadAvatar, isLoading: uploadingAvatar } = useMutation(
    (file) => authApi.uploadAvatar(file),
    {
      onSuccess: (updated) => { updateUserStore(updated); toast.success('Foto actualizada') },
      onError:   ()        => toast.error('Error al subir la imagen'),
    },
  )

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no puede superar 2MB'); return }
    uploadAvatar(file)
  }

  const { register: regProfile, handleSubmit: submitProfile } = useForm({
    defaultValues: { name: user?.name ?? '', username: user?.username ?? '', bio: user?.bio ?? '' },
  })

  const { register: regPayout, handleSubmit: submitPayout } = useForm({
    defaultValues: {
      cbu:  user?.payoutCbu  ?? '',
      mp:   user?.payoutMp   ?? '',
      usdt: user?.payoutUsdt ?? '',
    },
  })

  const { register: regPwd, handleSubmit: submitPwd, reset: resetPwd, formState: { errors: pwdErrors } } = useForm()

  const saveProfile = (data) => updateUser({ name: data.name, username: data.username, bio: data.bio })
  const savePayout  = (data) => updateUser({ payoutCbu: data.cbu, payoutMp: data.mp, payoutUsdt: data.usdt })

  const savePwd = (data) => {
    if (data.newPwd !== data.confirmPwd) { toast.error('Las contraseñas no coinciden'); return }
    changePwd({ currentPwd: data.currentPwd, newPwd: data.newPwd }, { onSuccess: () => resetPwd() })
  }

  const toggleRole = (roleId) => {
    if (roleId === 'buyer') return
    const roles = user?.roles ?? []
    const next = roles.includes(roleId) ? roles.filter(r => r !== roleId) : [...roles, roleId]
    updateUser({ roles: next })
  }

  return (
    <motion.div
      className="max-w-xl mx-auto px-4 py-8 space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-icon w-9 h-9">
          <RiArrowLeftLine size={18} />
        </button>
        <div>
          <p className="label mb-0.5">Configuración</p>
          <h1 className="font-bold text-xl">Mi cuenta</h1>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <Avatar src={user?.avatar} name={user?.name} size="2xl" ring />
          <button
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-brand-dark transition-transform active:scale-90"
            style={{ background: '#f59e0b' }}
            onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
          >
            {uploadingAvatar
              ? <RiLoader4Line size={13} className="animate-spin" />
              : <RiCameraLine size={14} />}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*"
                 className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm" style={{ color: '#52525b' }}>@{user?.username}</p>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {(user?.roles ?? []).map(r => {
              const meta = ROLE_META[r]
              return meta ? (
                <span key={r} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                  {meta.label}
                </span>
              ) : null
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto scrollbar-hide"
           style={{ border: '1px solid #27272a', background: '#111115' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
                  className="relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap overflow-hidden"
                  style={{ color: tab === id ? '#0c0c0e' : '#4b5563' }}>
            {tab === id && (
              <motion.span
                layoutId="settings-tab-bg"
                className="absolute inset-0 rounded-lg"
                style={{ background: '#f59e0b' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon size={13} />{label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >

          {/* ── Perfil ─────────────────────────────── */}
          {tab === 'profile' && (
            <form onSubmit={submitProfile(saveProfile)} className="card p-5 space-y-4">
              <h2 className="font-semibold">Información pública</h2>

              <div>
                <label className="label block mb-1.5">Nombre completo</label>
                <input {...regProfile('name', { required: true })} className="input" />
              </div>

              <div>
                <label className="label block mb-1.5">Nombre de usuario</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#52525b' }}>@</span>
                  <input {...regProfile('username', { required: true })}
                         className="input" style={{ paddingLeft: '1.75rem' }} />
                </div>
              </div>

              <div>
                <label className="label block mb-1.5">Bio</label>
                <textarea {...regProfile('bio')}
                          rows={3} placeholder="Contale a la comunidad quién sos..."
                          className="input resize-none" />
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full py-3 gap-2">
                {saving ? <><RiLoader4Line size={15} className="animate-spin" /> Guardando...</> : 'Guardar cambios'}
              </button>
            </form>
          )}

          {/* ── Roles ──────────────────────────────── */}
          {tab === 'roles' && (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: '#52525b' }}>
                Activá o desactivá roles según lo que querés hacer en la plataforma.
              </p>
              {ALL_ROLES.map(roleId => {
                const meta   = ROLE_META[roleId]
                const active = (user?.roles ?? []).includes(roleId)
                const always = roleId === 'buyer'
                return (
                  <motion.button
                    key={roleId}
                    onClick={() => toggleRole(roleId)}
                    whileHover={always ? {} : { scale: 1.01 }}
                    whileTap={always  ? {} : { scale: 0.99 }}
                    className="w-full card p-4 flex items-center gap-4 text-left transition-all"
                    style={{ borderColor: active ? `${meta.color}40` : '#27272a' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                         style={{ background: active ? `${meta.color}15` : 'rgba(255,255,255,0.04)' }}>
                      <meta.icon size={20} style={{ color: active ? meta.color : '#4b5563' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{meta.label}</p>
                      {always && <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>Este rol siempre está activo</p>}
                    </div>
                    <div className="w-11 h-6 rounded-full transition-all flex-shrink-0 relative"
                         style={{ background: active ? meta.color : '#27272a' }}>
                      <motion.div
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                        animate={{ left: active ? 'calc(100% - 1.375rem)' : '0.125rem' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* ── Direcciones ─────────────────────────────── */}
          {tab === 'addresses' && (
            <div className="space-y-3">
              {addresses.length === 0 ? (
                <div className="card p-8 text-center space-y-3">
                  <RiMapPinLine size={36} className="mx-auto opacity-20" />
                  <p className="text-sm" style={{ color: '#52525b' }}>No tenés direcciones guardadas</p>
                  <p className="text-xs" style={{ color: '#3d3d42' }}>
                    Guardá una dirección al finalizar tu próxima compra
                  </p>
                </div>
              ) : (
                addresses.map(addr => {
                  const isDefault = addr.id === defaultId
                  return (
                    <div key={addr.id}
                         className="card p-4 space-y-2 transition-all"
                         style={isDefault ? { borderColor: 'rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.03)' } : {}}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold">{addr.fullName}</p>
                            {isDefault && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                    style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                                Predeterminada
                              </span>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: '#52525b' }}>
                            {addr.street}<br />
                            {addr.city}, {addr.province} ({addr.zip})<br />
                            {addr.phone}
                            {addr.notes && <><br />{addr.notes}</>}
                          </p>
                        </div>
                        <button
                          onClick={() => { removeAddress(addr.id); toast.success('Dirección eliminada') }}
                          className="btn-icon w-8 h-8 flex-shrink-0"
                          style={{ color: '#4b5563' }}>
                          <RiDeleteBin6Line size={15} />
                        </button>
                      </div>

                      {!isDefault && (
                        <button
                          onClick={() => { setDefault(addr.id); toast.success('Dirección predeterminada actualizada') }}
                          className="flex items-center gap-1.5 text-xs font-medium"
                          style={{ color: '#f59e0b' }}>
                          <RiCheckLine size={12} /> Usar como predeterminada
                        </button>
                      )}
                    </div>
                  )
                })
              )}

              <p className="text-xs text-center pt-1 flex items-center justify-center gap-1.5" style={{ color: '#3d3d42' }}>
                <RiAddLine size={12} />
                Podés agregar nuevas direcciones al realizar un pedido
              </p>
            </div>
          )}

          {/* ── Cobros ─────────────────────────────────── */}
          {tab === 'payout' && (
            <form onSubmit={submitPayout(savePayout)} className="card p-5 space-y-4">
              <div>
                <h2 className="font-semibold">Métodos de cobro</h2>
                <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>Configurá cómo querés recibir tus ganancias.</p>
              </div>

              <div>
                <label className="label mb-1.5 flex items-center gap-1.5">
                  <RiBankLine size={13} /> CBU / CVU
                </label>
                <input {...regPayout('cbu')} placeholder="22 dígitos" className="input" maxLength={22} />
              </div>

              <div>
                <label className="label mb-1.5 flex items-center gap-1.5">
                  <RiWalletLine size={13} /> Mercado Pago
                </label>
                <input {...regPayout('mp')} placeholder="tu@email.com o alias.mp" className="input" />
              </div>

              <div>
                <label className="label mb-1.5 flex items-center gap-1.5">
                  <RiCoinLine size={13} /> USDT (Polygon)
                </label>
                <input {...regPayout('usdt')} placeholder="0x..." className="input font-mono text-sm" />
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full py-3 gap-2">
                {saving ? <><RiLoader4Line size={15} className="animate-spin" /> Guardando...</> : 'Guardar métodos'}
              </button>
            </form>
          )}

          {/* ── Cuenta ─────────────────────────────── */}
          {tab === 'account' && (
            <div className="space-y-4">
              <form onSubmit={submitPwd(savePwd)} className="card p-5 space-y-4">
                <h2 className="font-semibold">Cambiar contraseña</h2>

                <div>
                  <label className="label block mb-1.5">Contraseña actual</label>
                  <input {...regPwd('currentPwd', { required: true })} type="password" className="input" />
                </div>
                <div>
                  <label className="label block mb-1.5">Nueva contraseña</label>
                  <input {...regPwd('newPwd', { required: true, minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
                         type="password" className="input" />
                  {pwdErrors.newPwd && <p className="text-red-400 text-xs mt-1">{pwdErrors.newPwd.message}</p>}
                </div>
                <div>
                  <label className="label block mb-1.5">Confirmar nueva contraseña</label>
                  <input {...regPwd('confirmPwd', { required: true })} type="password" className="input" />
                </div>
                <button type="submit" disabled={savingPwd} className="btn-primary w-full py-3 gap-2">
                  {savingPwd ? <><RiLoader4Line size={15} className="animate-spin" /> Actualizando...</> : 'Actualizar contraseña'}
                </button>
              </form>

              <div className="card p-5 space-y-3">
                <h2 className="font-semibold">Sesión</h2>
                <p className="text-xs" style={{ color: '#52525b' }}>Vas a salir de tu cuenta en este dispositivo.</p>
                <button onClick={logout} className="btn-danger w-full py-3">Cerrar sesión</button>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
