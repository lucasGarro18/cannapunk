import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri'
import Logo from '@/components/ui/Logo'
import Spinner from '@/components/ui/Spinner'
import { useLogin } from '@/hooks/useAuth'

export default function LoginPage() {
  const { mutate: login, isLoading } = useLogin()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = (data) => login(data)

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: '#0c0c0e' }}>
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center">
          <Link to="/"><Logo size="lg" /></Link>
          <h1 className="mt-6 text-2xl font-bold">Iniciar sesión</h1>
          <p className="mt-1" style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Bienvenido de vuelta
          </p>
        </div>

        {/* Form card */}
        <div className="card p-6 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

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
                  {...register('password', { required: 'La contraseña es obligatoria' })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
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

            <div className="flex justify-end">
              <Link to="/forgot-password"
                    className="text-xs hover:underline"
                    style={{ color: '#f59e0b' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
              style={{ width: '100%' }}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  Iniciando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: '#6b7280' }}>
            ¿No tenés cuenta?{' '}
            <Link to="/register"
                  className="font-medium hover:underline"
                  style={{ color: '#f59e0b' }}>
              Registrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
