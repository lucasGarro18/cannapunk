import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { RiMailLine, RiArrowLeftLine, RiCheckLine } from 'react-icons/ri'
import Logo from '@/components/ui/Logo'
import Spinner from '@/components/ui/Spinner'
import { authApi } from '@/services/api'

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [devUrl, setDevUrl]     = useState(null)
  const [error, setError]       = useState(null)

  const onSubmit = async ({ email }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.resetRequest(email)
      setSent(true)
      if (res?.__devResetUrl) setDevUrl(res.__devResetUrl)
    } catch (e) {
      setError(e.response?.data?.error ?? 'Error al enviar el email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: '#0c0c0e' }}>
      <div className="w-full max-w-sm space-y-8">

        <div className="text-center">
          <Link to="/"><Logo size="lg" /></Link>
          <h1 className="mt-6 text-2xl font-bold">Recuperar contraseña</h1>
          <p className="mt-1 text-sm" style={{ color: '#6b7280' }}>
            Te enviamos un link para resetearla
          </p>
        </div>

        <div className="card p-6 space-y-4">
          {sent ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                   style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <RiCheckLine size={28} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <p className="font-semibold">¡Listo!</p>
                <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                  Si ese email está registrado vas a recibir el link en minutos.
                </p>
              </div>
              {devUrl && (
                <div className="p-3 rounded-xl text-left"
                     style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <p className="text-xs font-semibold neon-text mb-1">DEV — link de reset:</p>
                  <a href={devUrl} className="text-xs break-all hover:underline" style={{ color: '#a3a3a3' }}>
                    {devUrl}
                  </a>
                </div>
              )}
              <Link to="/login" className="btn-ghost w-full flex items-center justify-center gap-2 text-sm">
                <RiArrowLeftLine size={15} /> Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                              size={18} style={{ pointerEvents: 'none' }} />
                  <input
                    {...register('email', {
                      required: 'El email es obligatorio',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
                    })}
                    type="email"
                    placeholder="tu@email.com"
                    className="input"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? <><Spinner size="sm" /> Enviando...</> : 'Enviar link de reset'}
              </button>

              <Link to="/login"
                    className="flex items-center justify-center gap-1.5 text-sm hover:underline"
                    style={{ color: '#6b7280' }}>
                <RiArrowLeftLine size={14} /> Volver al login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
