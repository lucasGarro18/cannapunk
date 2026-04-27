import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
http.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401 solo si había sesión activa
http.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(err)
  },
)

// ----- Auth -----
export const authApi = {
  login:       (email, password)         => http.post('/auth/login',         { email, password }),
  register:    (data)                    => http.post('/auth/register',       data),
  me:          ()                        => http.get('/auth/me'),
  updateMe:    (data)                    => http.patch('/auth/me',            data),
  changePassword:  (currentPwd, newPwd)   => http.patch('/auth/me/password',   { currentPwd, newPwd }),
  resetRequest:    (email)               => http.post('/auth/reset-request',   { email }),
  resetConfirm:    (token, password)     => http.post('/auth/reset-confirm',   { token, password }),
  searchUsers:     (q)                   => http.get('/auth/users',             { params: { q } }),
  uploadAvatar: (file) => {
    const fd = new FormData()
    fd.append('avatar', file)
    return http.post('/auth/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// ----- Videos -----
export const videosApi = {
  getFeed:       (params)    => http.get('/videos',                 { params }),
  getByProduct:  (productId) => http.get(`/videos/product/${productId}`),
  getByCreator:  (username)  => http.get(`/videos/creator/${username}`),
  upload: (data, file, onProgress) => {
    if (file) {
      const fd = new FormData()
      fd.append('video', file)
      Object.entries(data).forEach(([k, v]) => v !== undefined && fd.append(k, Array.isArray(v) ? v.join(',') : v))
      return http.post('/videos/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total)),
      })
    }
    return http.post('/videos', data)
  },
  like:          (id)        => http.post(`/videos/${id}/like`),
  view:          (id)        => http.post(`/videos/${id}/view`),
  delete:        (id)        => http.delete(`/videos/${id}`),
}

// ----- Products -----
export const productsApi = {
  getAll:      (params)     => http.get('/products',         { params }),
  getById:     (id)         => http.get(`/products/${id}`),
  getFeatured: ()           => http.get('/products/featured'),
  search:      (q)          => http.get('/products',         { params: { q } }),
  getMine:     ()           => http.get('/products/mine'),
  create:      (data)       => http.post('/products',        data),
  update:      (id, data)   => http.patch(`/products/${id}`, data),
  delete:      (id)         => http.delete(`/products/${id}`),
  uploadImage: (file)       => {
    const fd = new FormData()
    fd.append('image', file)
    return http.post('/products/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// ----- Creators -----
export const creatorsApi = {
  getByUsername: (username) => http.get(`/creators/${username}`),
  getTop:        (params)   => http.get('/creators/top', { params }),
  follow:        (username) => http.post(`/creators/${username}/follow`),
}


// ----- Earnings -----
export const earningsApi = {
  getSummary: ()               => http.get('/earnings'),
  withdraw:   (amount, method) => http.post('/earnings/withdraw', { amount, method }),
}

// ----- Orders -----
export const ordersApi = {
  create:      (data)        => http.post('/orders',               data),
  getAll:      ()            => http.get('/orders'),
  getById:     (id)          => http.get(`/orders/${id}`),
  getDelivery: ()            => http.get('/orders/delivery'),
  getSeller:   ()            => http.get('/orders/seller'),
  advanceStatus: (id, status) => http.patch(`/orders/${id}/status`, { status }),
  cancel:        (id)         => http.patch(`/orders/${id}/cancel`),
}

// ----- Chat -----
export const chatApi = {
  getConversations:  ()                   => http.get('/chat/conversations'),
  startConversation: (userId)             => http.post('/chat/conversations', { userId }),
  getMessages:       (convId, cursor)     => http.get(`/chat/conversations/${convId}/messages`, { params: { cursor, limit: 40 } }),
  markRead:          (convId)             => http.patch(`/chat/conversations/${convId}/read`),
  sendMessage:       (convId, content)    => http.post(`/chat/conversations/${convId}/messages`, { content }),
  deleteMessage:     (msgId)             => http.delete(`/chat/messages/${msgId}`),
  uploadAttachment:  (file)              => {
    const fd = new FormData()
    fd.append('file', file)
    return http.post('/chat/upload', fd)
  },
}

// ----- MercadoPago -----
export const mpApi = {
  createCheckout: (data) => http.post('/mp/checkout', data),
}

// ----- Notifications -----
export const notificationsApi = {
  getAll:    ()   => http.get('/notifications'),
  markRead:  (id) => http.patch(`/notifications/${id}/read`),
  markAllRead:()  => http.patch('/notifications/read-all'),
}

// ----- Reviews -----
export const reviewsApi = {
  getByProduct: (productId)             => http.get(`/reviews/product/${productId}`),
  create:       (productId, data)       => http.post(`/reviews/product/${productId}`, data),
}

// ----- Referrals -----
export const referralsApi = {
  getSummary: () => http.get('/referrals'),
}

// ----- Coupons -----
export const couponsApi = {
  validate: (code, orderTotal) => http.post('/coupons/validate', { code, orderTotal }),
  getAll:   ()                 => http.get('/coupons'),
  create:   (data)             => http.post('/coupons', data),
  toggle:   (id, active)       => http.patch(`/coupons/${id}`, { active }),
  delete:   (id)               => http.delete(`/coupons/${id}`),
}

// ----- Admin -----
export const adminApi = {
  getStats:       ()                        => http.get('/admin/stats'),
  getUsers:       (params)                  => http.get('/admin/users', { params }),
  updateRoles:    (id, roles)               => http.patch(`/admin/users/${id}/roles`, { roles }),
  getCommissions: (params)                  => http.get('/admin/commissions', { params }),
  payCommission:  (id)                      => http.patch(`/admin/commissions/${id}/pay`),
  payAll:         (creatorId)               => http.patch('/admin/commissions/pay-all', { creatorId }),
  getOrders:         (params) => http.get('/admin/orders',              { params }),
  getWithdrawals:    (params) => http.get('/admin/withdrawals',            { params }),
  payWithdrawal:     (id)     => http.patch(`/admin/withdrawals/${id}/pay`),
  getProducts:       (params) => http.get('/admin/products',              { params }),
  approveProduct:    (id)     => http.patch(`/admin/products/${id}/approve`),
  rejectProduct:     (id, reason) => http.patch(`/admin/products/${id}/reject`, { reason }),
}
