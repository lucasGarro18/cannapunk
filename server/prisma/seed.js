const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const { serializeRoles, serializeTags } = require('../src/sqlite')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const hash = await bcrypt.hash('password123', 10)

  // Users
  const [admin, sofia, mati] = await Promise.all([
    prisma.user.upsert({
      where:  { email: 'admin@cannapont.com' },
      update: {},
      create: {
        name: 'Admin Cannapont', email: 'admin@cannapont.com',
        username: 'admin', passwordHash: hash,
        roles: serializeRoles(['buyer', 'creator', 'seller', 'admin']),
        onboardingDone: true,
        bio: 'El equipo de Cannapont',
      },
    }),
    prisma.user.upsert({
      where:  { email: 'sofia@cannapont.com' },
      update: {},
      create: {
        name: 'Sofía', email: 'sofia@cannapont.com',
        username: 'sofiapunk', passwordHash: hash,
        roles: serializeRoles(['buyer', 'creator']),
        onboardingDone: true,
        bio: 'Reviews honestas de tech y moda urbana 🎥',
        avatar: 'https://i.pravatar.cc/150?u=sofia',
      },
    }),
    prisma.user.upsert({
      where:  { email: 'mati@cannapont.com' },
      update: {},
      create: {
        name: 'Matias Verde', email: 'mati@cannapont.com',
        username: 'mativerde', passwordHash: hash,
        roles: serializeRoles(['buyer', 'creator', 'seller', 'delivery']),
        onboardingDone: true,
        bio: 'Vendedor y creador de contenido urbano 🔥',
        avatar: 'https://i.pravatar.cc/150?u=mati',
      },
    }),
  ])

  // Products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'prod_001' },
      update: {},
      create: {
        id: 'prod_001',
        name: 'Auriculares Punk Pro', description: 'Sonido brutal, cancelación de ruido activa, 40hs de batería.',
        price: 89999, originalPrice: 119999, category: 'Electronica',
        imageUrl: 'https://picsum.photos/seed/headphones/400/400',
        commissionPct: 10, stock: 50, rating: 4.8, reviewCount: 124,
        salesCount: 312, sellerId: mati.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod_002' },
      update: {},
      create: {
        id: 'prod_002',
        name: 'Street Runner V2', description: 'Zapatillas urbanas premium. Suela reforzada, diseño exclusivo.',
        price: 74999, originalPrice: 99999, category: 'Calzado',
        imageUrl: 'https://picsum.photos/seed/sneakers/400/400',
        commissionPct: 8, stock: 30, rating: 4.9, reviewCount: 89,
        salesCount: 201, sellerId: mati.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod_003' },
      update: {},
      create: {
        id: 'prod_003',
        name: 'Mochila Tactical EDC', description: 'Mochila táctica 30L, resistente al agua, múltiples compartimentos.',
        price: 54999, category: 'Accesorios',
        imageUrl: 'https://picsum.photos/seed/backpack/400/400',
        commissionPct: 12, stock: 80, rating: 4.7, reviewCount: 67,
        salesCount: 145, sellerId: admin.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod_004' },
      update: {},
      create: {
        id: 'prod_004',
        name: 'Remera Oversized Punk', description: 'Drop exclusivo. 100% algodón orgánico, corte oversized.',
        price: 24999, category: 'Indumentaria',
        imageUrl: 'https://picsum.photos/seed/tshirt/400/400',
        commissionPct: 15, stock: 200, rating: 4.6, reviewCount: 203,
        salesCount: 520, sellerId: admin.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod_005' },
      update: {},
      create: {
        id: 'prod_005',
        name: 'Smart Watch Ultra', description: 'GPS, monitor cardíaco, 14 días de batería, resistente al agua.',
        price: 149999, originalPrice: 199999, category: 'Electronica',
        imageUrl: 'https://picsum.photos/seed/watch/400/400',
        commissionPct: 9, stock: 25, rating: 4.5, reviewCount: 45,
        salesCount: 88, sellerId: mati.id,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod_006' },
      update: {},
      create: {
        id: 'prod_006',
        name: 'Hoodie Urban Dark', description: 'Hoodie con capucha, interior polar, diseño exclusivo.',
        price: 34999, originalPrice: 44999, category: 'Indumentaria',
        imageUrl: 'https://picsum.photos/seed/hoodie/400/400',
        commissionPct: 12, stock: 150, rating: 4.8, reviewCount: 156,
        salesCount: 389, sellerId: admin.id,
      },
    }),
  ])

  const VIDEO_URLS = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  ]

  // Videos
  await Promise.all([
    prisma.video.upsert({
      where: { id: 'vid_001' },
      update: { videoUrl: VIDEO_URLS[0] },
      create: {
        id: 'vid_001',
        title: 'Review Auriculares Punk Pro — valen cada peso?',
        description: 'Análisis completo después de 2 semanas de uso.',
        thumbnailUrl: 'https://picsum.photos/seed/vid1/400/700',
        videoUrl: VIDEO_URLS[0],
        likes: 1240, views: 45300, commissionPct: 10, tags: serializeTags(['electronica', 'review', 'audio']),
        creatorId: sofia.id, productId: 'prod_001',
      },
    }),
    prisma.video.upsert({
      where: { id: 'vid_002' },
      update: { videoUrl: VIDEO_URLS[1] },
      create: {
        id: 'vid_002',
        title: 'Unboxing Street Runner V2 — el mejor calzado urbano?',
        description: 'Primeras impresiones y fit check completo.',
        thumbnailUrl: 'https://picsum.photos/seed/vid2/400/700',
        videoUrl: VIDEO_URLS[1],
        likes: 890, views: 32100, commissionPct: 8, tags: serializeTags(['calzado', 'unboxing', 'moda']),
        creatorId: sofia.id, productId: 'prod_002',
      },
    }),
    prisma.video.upsert({
      where: { id: 'vid_003' },
      update: { videoUrl: VIDEO_URLS[2] },
      create: {
        id: 'vid_003',
        title: 'Mochila Tactical EDC — perfecta para el día a día',
        description: 'Qué cabe adentro, calidad de materiales y veredicto final.',
        thumbnailUrl: 'https://picsum.photos/seed/vid3/400/700',
        videoUrl: VIDEO_URLS[2],
        likes: 654, views: 18700, commissionPct: 12, tags: serializeTags(['accesorios', 'edc', 'review']),
        creatorId: mati.id, productId: 'prod_003',
      },
    }),
  ])

  // Orders + Commissions para que el wallet muestre datos reales
  const order1 = await prisma.order.upsert({
    where: { id: 'ord_001' },
    update: {},
    create: {
      id: 'ord_001', buyerId: admin.id, total: 89999, status: 'delivered',
      address: JSON.stringify({ street: 'Av. Corrientes 1234', city: 'CABA', zip: '1043' }),
      referrerId: 'vid_001',
      items: { create: [{ productId: 'prod_001', qty: 1, unitPrice: 89999 }] },
    },
  })
  const order2 = await prisma.order.upsert({
    where: { id: 'ord_002' },
    update: {},
    create: {
      id: 'ord_002', buyerId: admin.id, total: 74999, status: 'shipped',
      address: JSON.stringify({ street: 'Av. Santa Fe 800', city: 'CABA', zip: '1059' }),
      referrerId: 'vid_002',
      items: { create: [{ productId: 'prod_002', qty: 1, unitPrice: 74999 }] },
    },
  })
  const order3 = await prisma.order.upsert({
    where: { id: 'ord_003' },
    update: {},
    create: {
      id: 'ord_003', buyerId: mati.id, total: 54999, status: 'delivered',
      address: JSON.stringify({ street: 'Belgrano 500', city: 'Mendoza', zip: '5500' }),
      referrerId: 'vid_001',
      items: { create: [{ productId: 'prod_003', qty: 1, unitPrice: 54999 }] },
    },
  })

  await Promise.all([
    prisma.commission.upsert({
      where: { id: 'com_001' },
      update: {},
      create: { id: 'com_001', creatorId: sofia.id, videoId: 'vid_001', orderId: order1.id, amount: 8999, status: 'pending' },
    }),
    prisma.commission.upsert({
      where: { id: 'com_002' },
      update: {},
      create: { id: 'com_002', creatorId: sofia.id, videoId: 'vid_002', orderId: order2.id, amount: 5999, status: 'pending' },
    }),
    prisma.commission.upsert({
      where: { id: 'com_003' },
      update: {},
      create: { id: 'com_003', creatorId: sofia.id, videoId: 'vid_001', orderId: order3.id, amount: 5499, status: 'paid' },
    }),
  ])

  console.log('✅ Seed completado')
  console.log('   Usuarios de prueba:')
  console.log('   📧 admin@cannapont.com / password123')
  console.log('   📧 sofia@cannapont.com / password123')
  console.log('   📧 mati@cannapont.com  / password123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
