import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout         from '@/components/layout/Layout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import RoleRoute      from '@/components/auth/RoleRoute'
import Spinner        from '@/components/ui/Spinner'
import ErrorBoundary  from '@/components/ui/ErrorBoundary'

// Eager — shell siempre visible
const HomePage     = lazy(() => import('@/pages/HomePage'))
const FeedPage     = lazy(() => import('@/pages/FeedPage'))

// Lazy — todo lo demás
const MarketplacePage   = lazy(() => import('@/pages/MarketplacePage'))
const ProductPage       = lazy(() => import('@/pages/ProductPage'))
const ProfilePage       = lazy(() => import('@/pages/ProfilePage'))
const SearchPage        = lazy(() => import('@/pages/SearchPage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const LoginPage           = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage        = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage  = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const ResetPasswordPage   = lazy(() => import('@/pages/auth/ResetPasswordPage'))
const NotFoundPage      = lazy(() => import('@/pages/NotFoundPage'))
const UploadPage        = lazy(() => import('@/pages/UploadPage'))
const WalletPage        = lazy(() => import('@/pages/WalletPage'))
const OrdersPage        = lazy(() => import('@/pages/OrdersPage'))
const OrderDetailPage   = lazy(() => import('@/pages/OrderDetailPage'))
const EarningsPage      = lazy(() => import('@/pages/EarningsPage'))
const CheckoutPage      = lazy(() => import('@/pages/CheckoutPage'))
const SettingsPage      = lazy(() => import('@/pages/SettingsPage'))
const SellerDashboard   = lazy(() => import('@/pages/SellerDashboard'))
const DeliveryDashboard = lazy(() => import('@/pages/DeliveryDashboard'))
const OnboardingPage    = lazy(() => import('@/pages/OnboardingPage'))
const ChatPage          = lazy(() => import('@/pages/ChatPage'))
const CreatorsPage      = lazy(() => import('@/pages/CreatorsPage'))
const ReferralsPage     = lazy(() => import('@/pages/ReferralsPage'))
const WishlistPage      = lazy(() => import('@/pages/WishlistPage'))
const AdminPage         = lazy(() => import('@/pages/AdminPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/onboarding"      element={<OnboardingPage />} />

        {/* App shell */}
        <Route element={<Layout />}>
          {/* Public */}
          <Route index                     element={<HomePage />} />
          <Route path="/feed"              element={<FeedPage />} />
          <Route path="/market"            element={<MarketplacePage />} />
          <Route path="/product/:id"       element={<ProductPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/search"            element={<SearchPage />} />
          <Route path="/creators"          element={<CreatorsPage />} />
          <Route path="/wishlist"          element={<WishlistPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/upload"    element={<UploadPage />} />
            <Route path="/wallet"    element={<WalletPage />} />
            <Route path="/orders"    element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/earnings"  element={<EarningsPage />} />
            <Route path="/profile"   element={<ProfilePage />} />
            <Route path="/checkout"  element={<CheckoutPage />} />
            <Route path="/settings"  element={<SettingsPage />} />
            <Route path="/chat"       element={<ChatPage />} />
            <Route path="/chat/:id"   element={<ChatPage />} />
            <Route path="/referrals"  element={<ReferralsPage />} />
            <Route element={<RoleRoute role="seller" />}>
              <Route path="/seller"  element={<SellerDashboard />} />
            </Route>
            <Route element={<RoleRoute role="delivery" />}>
              <Route path="/delivery" element={<DeliveryDashboard />} />
            </Route>
            <Route element={<RoleRoute role="admin" />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
    </ErrorBoundary>
  )
}
