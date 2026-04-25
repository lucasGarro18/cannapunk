import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import {
  RiLockLine, RiArrowRightLine,
} from 'react-icons/ri'
import { Link } from 'react-router-dom'

export default function RoleRoute({ role }) {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!(user?.roles ?? []).includes(role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
               style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <RiLockLine size={28} style={{ color: 'rgba(245,158,11,0.4)' }} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Acceso restringido</h2>
            <p className="text-sm text-gray-500">
              Necesitás el rol{' '}
              <span className="font-semibold text-white capitalize">{role}</span>
              {' '}para acceder a esta sección.
            </p>
          </div>
          <Link to="/settings" className="btn-primary gap-2 inline-flex">
            Activar rol en ajustes <RiArrowRightLine size={15} />
          </Link>
        </div>
      </div>
    )
  }

  return <Outlet />
}
