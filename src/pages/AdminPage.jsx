import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import {
  RiShieldUserLine, RiBarChartLine, RiUserLine, RiMoneyDollarCircleLine,
  RiShoppingBag3Line, RiCheckLine, RiSearchLine, RiArrowRightLine,
  RiVideoLine, RiRefreshLine, RiBankLine, RiTimeLine,
  RiArrowLeftLine,
} from 'react-icons/ri'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import { adminApi } from '@/services/api'
import { formatCurrency } from '@/utils/format'

function Pagination({ page, pages, total, onPage }) {
  if (!pages || pages <= 1) return null
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-gray-600">{total} registros · página {page} de {pages}</p>
      <div className="flex gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ border: '1px solid #27272a', color: '#6b7280' }}
                onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#27272a')}>
          <RiArrowLeftLine size={13} />
        </button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const p = pages <= 5 ? i + 1 : Math.max(1, Math.min(pages - 4, page - 2)) + i
          return (
            <button key={p} onClick={() => onPage(p)}
                    className="w-7 h-7 rounded-lg text-xs font-medium transition-colors"
                    style={p === page
                      ? { background: '#f59e0b', color: '#0c0c0e' }
                      : { border: '1px solid #27272a', color: '#6b7280' }}>
              {p}
            </button>
          )
        })}
        <button onClick={() => onPage(page + 1)} disabled={page >= pages}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ border: '1px solid #27272a', color: '#6b7280' }}
                onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#27272a')}>
          <RiArrowRightLine size={13} />
        </button>
      </div>
    </div>
  )
}

const TABS = [
  { id: 'stats',        label: 'Stats',       icon: RiBarChartLine         },
  { id: 'users',        label: 'Usuarios',    icon: RiUserLine             },
  { id: 'products',     label: 'Productos',   icon: RiShoppingBag3Line     },
  { id: 'commissions',  label: 'Comisiones',  icon: RiMoneyDollarCircleLine },
  { id: 'withdrawals',  label: 'Retiros',     icon: RiBankLine             },
  { id: 'orders',       label: 'Pedidos',     icon: RiShoppingBag3Line     },
]

const ALL_ROLES = ['buyer', 'creator', 'seller', 'delivery', 'admin']

function StatBox({ label, value, icon: Icon, color = '#f59e0b' }) {
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{label}</p>
        <Icon size={16} style={{ color }} />
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function StatsTab() {
  const { data, isLoading } = useQuery(['admin', 'stats'], () => adminApi.getStats())
  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <StatBox label="Usuarios"           value={data?.users ?? 0}                            icon={RiUserLine}             color="#a78bfa" />
      <StatBox label="Productos"          value={data?.products ?? 0}                          icon={RiShoppingBag3Line}     color="#60a5fa" />
      <StatBox label="Pedidos"            value={data?.orders ?? 0}                            icon={RiShoppingBag3Line}     color="#34d399" />
      <StatBox label="Total comisiones"   value={formatCurrency(data?.totalCommissions ?? 0)}  icon={RiMoneyDollarCircleLine} color="#f59e0b" />
      <StatBox label="Comisiones pendientes" value={formatCurrency(data?.pendingCommissions ?? 0)} icon={RiMoneyDollarCircleLine} color="#f87171" />
    </div>
  )
}

function UsersTab() {
  const qc = useQueryClient()
  const [q, setQ]         = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editingId, setEditingId]   = useState(null)
  const [draftRoles, setDraftRoles] = useState([])
  const [page, setPage]   = useState(1)

  const { data, isLoading } = useQuery(
    ['admin', 'users', q, roleFilter, page],
    () => adminApi.getUsers({ q: q || undefined, role: roleFilter || undefined, page }),
    { keepPreviousData: true },
  )

  const handleFilterChange = (fn) => { fn(); setPage(1) }

  const { mutate: saveRoles, isLoading: saving } = useMutation(
    ({ id, roles }) => adminApi.updateRoles(id, roles),
    {
      onSuccess: () => {
        toast.success('Roles actualizados')
        setEditingId(null)
        qc.invalidateQueries(['admin', 'users'])
      },
      onError: () => toast.error('Error al actualizar'),
    },
  )

  const startEdit = (user) => {
    setEditingId(user.id)
    setDraftRoles(user.roles ?? [])
  }

  const toggleRole = (role) => {
    setDraftRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={15} />
          <input value={q} onChange={e => handleFilterChange(() => setQ(e.target.value))}
                 placeholder="Buscar por nombre, usuario o email..."
                 className="input text-sm w-full" style={{ paddingLeft: '2.25rem' }} />
        </div>
        <select value={roleFilter} onChange={e => handleFilterChange(() => setRoleFilter(e.target.value))} className="input text-sm w-36">
          <option value="">Todos los roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}

      <div className="space-y-2">
        {(data?.users ?? []).map(user => (
          <div key={user.id} className="card p-4">
            <div className="flex items-start gap-3">
              <Avatar src={user.avatar} name={user.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">@{user.username} · {user.email}</p>
                  </div>
                  <button onClick={() => editingId === user.id ? setEditingId(null) : startEdit(user)}
                          className="btn-secondary text-xs py-1 px-3">
                    {editingId === user.id ? 'Cancelar' : 'Roles'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(user.roles ?? []).map(r => (
                    <span key={r} className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                      {r}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3 mt-1 text-xs text-gray-600">
                  <span>{user._count?.orders ?? 0} pedidos</span>
                  <span>{user._count?.videos ?? 0} videos</span>
                </div>
              </div>
            </div>

            {editingId === user.id && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid #27272a' }}>
                <p className="text-xs text-gray-500 mb-2">Seleccioná los roles:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {ALL_ROLES.map(r => (
                    <button key={r} onClick={() => toggleRole(r)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
                            style={{
                              background: draftRoles.includes(r) ? 'rgba(245,158,11,0.15)' : 'transparent',
                              border: `1px solid ${draftRoles.includes(r) ? 'rgba(245,158,11,0.4)' : '#3f3f46'}`,
                              color: draftRoles.includes(r) ? '#f59e0b' : '#6b7280',
                            }}>
                      {r}
                    </button>
                  ))}
                </div>
                <button onClick={() => saveRoles({ id: user.id, roles: draftRoles })}
                        disabled={saving} className="btn-primary text-xs py-2 px-4 gap-2">
                  {saving ? <Spinner size="sm" /> : <RiCheckLine size={13} />}
                  Guardar cambios
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <Pagination page={page} pages={data?.pages} total={data?.total} onPage={setPage} />
    </div>
  )
}

function CommissionsTab() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')

  const { data, isLoading } = useQuery(
    ['admin', 'commissions', statusFilter],
    () => adminApi.getCommissions({ status: statusFilter || undefined }),
    { keepPreviousData: true },
  )

  const { mutate: pay, isLoading: paying, variables: payingId } = useMutation(
    (id) => adminApi.payCommission(id),
    {
      onSuccess: () => { toast.success('Comisión pagada'); qc.invalidateQueries(['admin', 'commissions']) },
      onError: () => toast.error('Error al procesar el pago'),
    },
  )

  const { mutate: payAll, isLoading: payingAll } = useMutation(
    (creatorId) => adminApi.payAll(creatorId),
    {
      onSuccess: (d) => {
        toast.success(`${d.paid} comisiones procesadas`)
        qc.invalidateQueries(['admin', 'commissions'])
      },
      onError: () => toast.error('Error'),
    },
  )

  const grouped = (data?.commissions ?? []).reduce((acc, c) => {
    const key = c.creator.id
    if (!acc[key]) acc[key] = { creator: c.creator, items: [], total: 0 }
    acc[key].items.push(c)
    acc[key].total += c.amount
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['pending', 'paid', ''].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: statusFilter === s ? 'rgba(245,158,11,0.15)' : 'transparent',
                    border: `1px solid ${statusFilter === s ? 'rgba(245,158,11,0.4)' : '#3f3f46'}`,
                    color: statusFilter === s ? '#f59e0b' : '#6b7280',
                  }}>
            {s === 'pending' ? 'Pendientes' : s === 'paid' ? 'Pagadas' : 'Todas'}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}

      {Object.values(grouped).map(({ creator, items, total }) => (
        <div key={creator.id} className="card overflow-hidden">
          <div className="p-4 flex items-center justify-between"
               style={{ background: 'rgba(245,158,11,0.03)', borderBottom: '1px solid #27272a' }}>
            <div>
              <p className="font-semibold text-sm">@{creator.username}</p>
              <p className="text-xs text-gray-500">{items.length} comisiones · {formatCurrency(total)} total</p>
              {creator.payoutCbu && <p className="text-xs text-gray-600 mt-0.5">CBU: {creator.payoutCbu}</p>}
              {creator.payoutMp  && <p className="text-xs text-gray-600 mt-0.5">MP: {creator.payoutMp}</p>}
            </div>
            {statusFilter === 'pending' && (
              <button onClick={() => payAll(creator.id)} disabled={payingAll}
                      className="btn-primary text-xs py-2 px-3 gap-1.5">
                {payingAll ? <Spinner size="sm" /> : <RiCheckLine size={13} />}
                Pagar todo
              </button>
            )}
          </div>
          <div className="divide-y" style={{ borderColor: '#27272a' }}>
            {items.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm">{c.video?.title ?? '—'}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(c.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm neon-text">{formatCurrency(c.amount)}</span>
                  {c.status === 'pending' ? (
                    <button onClick={() => pay(c.id)} disabled={paying && payingId === c.id}
                            className="btn-secondary text-xs py-1 px-2.5 gap-1">
                      {paying && payingId === c.id ? <Spinner size="sm" /> : <RiCheckLine size={12} />}
                      Pagar
                    </button>
                  ) : (
                    <span className="text-xs font-medium" style={{ color: '#f59e0b' }}>Pagada</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!isLoading && Object.keys(grouped).length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <RiMoneyDollarCircleLine size={32} className="mx-auto opacity-30 mb-3" />
          <p className="text-sm">No hay comisiones {statusFilter === 'pending' ? 'pendientes' : ''}</p>
        </div>
      )}
    </div>
  )
}

const STATUS_COLORS = { pending: '#f59e0b', active: '#4ade80', rejected: '#f87171' }
const STATUS_LABELS = { pending: 'Pendiente', active: 'Activo', rejected: 'Rechazado' }

function ProductsTab() {
  const [filter, setFilter] = useState('pending')
  const qc = useQueryClient()

  const { data: products = [], isLoading } = useQuery(
    ['admin', 'products', filter],
    () => adminApi.getProducts({ status: filter }),
  )

  const { mutate: approve } = useMutation(
    (id) => adminApi.approveProduct(id),
    { onSuccess: () => { toast.success('Producto aprobado'); qc.invalidateQueries(['admin', 'products']) },
      onError:   () => toast.error('Error al aprobar') },
  )
  const { mutate: reject } = useMutation(
    (id) => adminApi.rejectProduct(id, 'No cumple los requisitos de la plataforma'),
    { onSuccess: () => { toast.success('Producto rechazado'); qc.invalidateQueries(['admin', 'products']) },
      onError:   () => toast.error('Error al rechazar') },
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['pending','Pendientes'],['active','Activos'],['rejected','Rechazados']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                  style={{ background: filter === v ? '#f59e0b' : '#1c1c1f', color: filter === v ? '#0c0c0e' : '#6b7280', border: '1px solid #27272a' }}>
            {l}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner /> : products.length === 0 ? (
        <p className="text-center py-10 text-sm text-gray-600">No hay productos en este estado</p>
      ) : (
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className="card p-4 flex items-center gap-4">
              <img src={p.imageUrl} alt={p.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-500">{p.seller.name} · {p.category}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: STATUS_COLORS[p.status] }}>
                  {STATUS_LABELS[p.status]}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm">{formatCurrency(p.price)}</p>
                <p className="text-xs text-gray-500">{p.commissionPct}% comisión</p>
              </div>
              {p.status === 'pending' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => approve(p.id)} className="btn-primary text-xs px-3 py-2 gap-1">
                    <RiCheckLine size={13} /> Aprobar
                  </button>
                  <button onClick={() => reject(p.id)}
                          className="text-xs px-3 py-2 rounded-xl font-medium transition-colors"
                          style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const METHOD_LABEL = { cbu: 'CBU / CVU', mercado: 'Mercado Pago', crypto: 'USDT (Polygon)' }

function WithdrawalsTab() {
  const [filter, setFilter] = useState('pending')
  const qc = useQueryClient()

  const { data: withdrawals = [], isLoading } = useQuery(
    ['admin', 'withdrawals', filter],
    () => adminApi.getWithdrawals({ status: filter || undefined }),
  )

  const { mutate: pay, isLoading: paying } = useMutation(
    (id) => adminApi.payWithdrawal(id),
    {
      onSuccess: () => { toast.success('Retiro marcado como pagado'); qc.invalidateQueries(['admin', 'withdrawals']) },
      onError:   () => toast.error('Error al procesar'),
    },
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['pending', 'Pendientes'], ['completed', 'Pagados'], ['', 'Todos']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                  style={{ background: filter === v ? '#f59e0b' : '#1c1c1f', color: filter === v ? '#0c0c0e' : '#6b7280', border: '1px solid #27272a' }}>
            {l}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner /> : withdrawals.length === 0 ? (
        <p className="text-center py-10 text-sm text-gray-600">No hay retiros</p>
      ) : (
        <div className="space-y-3">
          {withdrawals.map(w => (
            <div key={w.id} className="card p-4 flex items-center gap-4">
              <Avatar src={w.user.avatar} name={w.user.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{w.user.name}</p>
                <p className="text-xs text-gray-500">@{w.user.username} · {METHOD_LABEL[w.method] ?? w.method}</p>
                <p className="text-xs text-gray-600 mt-0.5 truncate">
                  {w.method === 'cbu' && w.user.payoutCbu}
                  {w.method === 'mercado' && w.user.payoutMp}
                  {w.method === 'crypto' && w.user.payoutUsdt}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-brand-neon">{formatCurrency(w.amount)}</p>
                <p className="text-xs mt-0.5" style={{ color: w.status === 'completed' ? '#4ade80' : '#f59e0b' }}>
                  {w.status === 'completed' ? '✓ Pagado' : 'Pendiente'}
                </p>
              </div>
              {w.status === 'pending' && (
                <button onClick={() => pay(w.id)} disabled={paying}
                        className="btn-primary text-xs px-3 py-2 gap-1.5 flex-shrink-0">
                  <RiCheckLine size={13} /> Pagar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OrdersTab() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery(
    ['admin', 'orders', statusFilter, page],
    () => adminApi.getOrders({ status: statusFilter || undefined, page }),
    { keepPreviousData: true },
  )

  const STATUS_COLORS = {
    processing: { color: '#fbbf24', label: 'Preparación' },
    pickup:     { color: '#60a5fa', label: 'Retiro'      },
    shipping:   { color: '#60a5fa', label: 'En camino'   },
    delivered:  { color: '#34d399', label: 'Entregado'   },
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {[['', 'Todos'], ['processing', 'Preparación'], ['shipping', 'En camino'], ['delivered', 'Entregados']].map(([s, l]) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: statusFilter === s ? 'rgba(245,158,11,0.15)' : 'transparent',
                    border: `1px solid ${statusFilter === s ? 'rgba(245,158,11,0.4)' : '#3f3f46'}`,
                    color: statusFilter === s ? '#f59e0b' : '#6b7280',
                  }}>
            {l}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}

      <div className="space-y-2">
        {(data?.orders ?? []).map(order => {
          const meta = STATUS_COLORS[order.status] ?? STATUS_COLORS.processing
          return (
            <div key={order.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold font-mono" style={{ color: '#4b5563' }}>
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{order.buyer?.name ?? '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order.items?.map(i => i.product?.name).join(', ')}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p className="font-bold text-sm flex-shrink-0">{formatCurrency(order.total)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {!isLoading && (data?.orders ?? []).length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <RiShoppingBag3Line size={32} className="mx-auto opacity-30 mb-3" />
          <p className="text-sm">No hay pedidos</p>
        </div>
      )}
      <Pagination page={page} pages={data?.pages} total={data?.total} onPage={setPage} />
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState('stats')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <p className="label mb-1">Panel de administración</p>
        <h1 className="section-title" style={{ fontSize: '1.75rem' }}>
          Control <span className="neon-text">CannaPunk</span>
        </h1>
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ border: '1px solid #27272a', background: '#111115' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={tab === id
                    ? { background: '#f59e0b', color: '#0c0c0e' }
                    : { color: '#4b5563' }}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === 'stats'        && <StatsTab />}
      {tab === 'users'        && <UsersTab />}
      {tab === 'products'     && <ProductsTab />}
      {tab === 'commissions'  && <CommissionsTab />}
      {tab === 'withdrawals'  && <WithdrawalsTab />}
      {tab === 'orders'       && <OrdersTab />}
    </div>
  )
}
