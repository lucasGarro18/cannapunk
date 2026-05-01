import { Link } from 'react-router-dom'
import { RiStarFill, RiShoppingBag3Line, RiVideoLine, RiHeartLine, RiHeartFill } from 'react-icons/ri'
import toast from 'react-hot-toast'
import { formatCurrency, formatNumber } from '@/utils/format'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { CardContainer, CardBody, CardItem } from '@/components/ui/Card3D'

export default function ProductCard({ product }) {
  const { id, name, imageUrl, price, originalPrice, rating, reviewCount, videoCount, commissionPct, category } = product
  const discount       = originalPrice ? Math.round((1 - price / originalPrice) * 100) : null
  const addItem        = useCartStore(s => s.addItem)
  const openCart       = useUIStore(s => s.openCart)
  const { toggle, isWishlisted } = useWishlistStore()
  const wishlisted     = isWishlisted(id)

  const handleQuickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    toast.success(`${name} agregado al carrito`)
    openCart()
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const added = toggle(product)
    toast(added ? `Guardado en favoritos` : `Eliminado de favoritos`,
      { icon: added ? '♥' : '🗑', duration: 1800 })
  }

  return (
    <CardContainer>
      <CardBody as={Link} to={`/product/${id}`} className="card-hover flex flex-col group">

        {/* Image */}
        <CardItem translateZ={20} className="relative aspect-square overflow-hidden rounded-t-2xl bg-brand-surface">
          <img src={imageUrl} alt={name}
               className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" />

          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <CardItem translateZ={40} className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
            {discount && <span className="badge-red">{discount}% OFF</span>}
            {commissionPct && <span className="badge-neon badge-commission-pulse">+{commissionPct}%</span>}
          </CardItem>

          <CardItem
            translateZ={40}
            as="button"
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-all duration-200"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
            {wishlisted
              ? <RiHeartFill size={14} className="text-red-400" />
              : <RiHeartLine size={14} className="text-white" />}
          </CardItem>

          <CardItem
            translateZ={40}
            as="button"
            onClick={handleQuickAdd}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center
                       opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
                       transition-all duration-200 text-brand-dark"
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
            <RiShoppingBag3Line size={15} />
          </CardItem>
        </CardItem>

        {/* Info */}
        <CardItem translateZ={10} className="p-3 flex flex-col gap-1.5 flex-1">
          <p className="label truncate">{category}</p>
          <h3 className="text-sm font-semibold text-gray-100 line-clamp-2 leading-snug">{name}</h3>

          <div className="flex items-center gap-1.5 mt-0.5">
            <RiStarFill size={12} className="text-amber-400 flex-shrink-0" />
            <span className="text-xs text-gray-500">{rating}</span>
            <span className="text-xs text-gray-700">({formatNumber(reviewCount)})</span>
            {videoCount > 0 && (
              <>
                <span className="text-gray-800 text-xs">·</span>
                <RiVideoLine size={11} className="text-gray-700 flex-shrink-0" />
                <span className="text-xs text-gray-700">{videoCount}</span>
              </>
            )}
          </div>

          <div className="mt-auto pt-1.5 flex items-end gap-2">
            <div>
              <p className="text-base font-bold text-white">{formatCurrency(price)}</p>
              {originalPrice && (
                <p className="text-[11px] text-gray-700 line-through leading-none mt-0.5">
                  {formatCurrency(originalPrice)}
                </p>
              )}
            </div>
          </div>
        </CardItem>

      </CardBody>
    </CardContainer>
  )
}
