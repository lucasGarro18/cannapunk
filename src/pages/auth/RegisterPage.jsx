import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { RiMailLine, RiLockLine, RiUserLine, RiAtLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri'
import Logo from '@/components/ui/Logo'
import Spinner from '@/components/ui/Spinner'
import { useRegister } from '@/hooks/useAuth'

export default function RegisterPage() {
  const { mutate: register_, isLoading } = useRegister()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [showPassword, setShowPassword] = useState(false)
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref')

  const onSubmit = (data) => register_({ ...data, referredBy: refCode ?? undefined })

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
         style={{ background: 'linear-gradient(180deg, #0c0c0e 0%, #111115 100%)' }}>
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center">
          <Link to="/"><Logo size="lg" /></Link>
          <h1 className="mt-6 text-2xl font-bold">Crear cuenta</h1>
          <p className="mt-1" style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Empezá a ganar desde hoy
          </p>
        </div>

        {/* Form card */}
        <div className="card p-6">
          {refCode && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-2"
                 style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <span style={{ fontSize: '1rem' }}>🎁</span>
              <p className="text-xs" style={{ color: '#d97706' }}>
                Fuiste invitado por <strong>@{refCode}</strong> — vas a obtener beneficios de bienvenida.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium mb-2">Nombre completo</label>
              <div className="relative">
                <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                            size={18} style={{ pointerEvents: 'none' }} />
                <input
                  {...register('name', { required: 'El nombre es obligatorio' })}
                  type="text"
                  placeholder="Sofía Punk"
                  className="input"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2">Nombre de usuario</label>
              <div className="relative">
                <RiAtLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                          size={18} style={{ pointerEvents: 'none' }} />
                <input
                  {...register('username', {
                    required: 'El usuario es obligatorio',
                    minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                    maxLength: { value: 20, message: 'Máximo 20 caracteres' },
                    pattern: { value: /^[a-z0-9_]+$/, message: 'Solo letras minúsculas, números y _' },
                  })}
                  type="text"
                  placeholder="sofiapunk"
                  className="input"
                  style={{ paddingLeft: '2.5rem' }}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              {errors.username
                ? <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>
                : <p className="text-xs text-gray-700 mt-1">Solo letras minúsculas, números y guión bajo</p>}
            </div>

            {/* Email */}
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
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium mb-2">Contraseña</label>
              <div className="relative">
                <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                            size={18} style={{ pointerEvents: 'none' }} />
                <input
                  {...register('password', {
                    required: 'La contraseña es obligatoria',
                    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className="input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 mt-2"
              style={{ width: '100%' }}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta gratis'
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: '#6b7280' }}>
            ¿Ya tenés cuenta?{' '}
            <Link to="/login"
                  className="font-medium hover:underline"
                  style={{ color: '#f59e0b' }}>
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
