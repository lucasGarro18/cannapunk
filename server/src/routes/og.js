const router = require('express').Router()
const prisma  = require('../db')

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://cannapont.vercel.app'
const DEFAULT_IMG  = `${FRONTEND_URL}/og-default.png`

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function html({ title, description, image, url, type = 'website' }) {
  const t = esc(title)
  const d = esc(description)
  const img = esc(image)
  const u   = esc(url)
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${t}</title>
<meta name="description" content="${d}" />
<meta property="og:type"        content="${type}" />
<meta property="og:title"       content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:image"       content="${img}" />
<meta property="og:url"         content="${u}" />
<meta property="og:site_name"   content="Cannapont" />
<meta name="twitter:card"        content="summary_large_image" />
<meta name="twitter:title"       content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image"       content="${img}" />
<meta http-equiv="refresh" content="0; url=${u}" />
</head>
<body><a href="${u}">Redirigiendo…</a></body>
</html>`
}

// GET /api/og/product/:id
router.get('/product/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where:  { id: req.params.id },
      select: { name: true, description: true, imageUrl: true },
    })
    if (!product) return res.status(404).send('Not found')

    const url = `${FRONTEND_URL}/product/${req.params.id}`
    res.set('Cache-Control', 'public, max-age=3600')
    res.set('Content-Type', 'text/html; charset=utf-8')
    res.send(html({
      title:       `${product.name} | Cannapont`,
      description: (product.description ?? '').slice(0, 160),
      image:       product.imageUrl || DEFAULT_IMG,
      url,
      type:        'product',
    }))
  } catch (err) {
    console.error('[OG product]', err)
    res.status(500).send('Error')
  }
})

// GET /api/og/profile/:username
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { username: req.params.username },
      select: { name: true, bio: true, avatar: true },
    })
    if (!user) return res.status(404).send('Not found')

    const url = `${FRONTEND_URL}/profile/${req.params.username}`
    res.set('Cache-Control', 'public, max-age=3600')
    res.set('Content-Type', 'text/html; charset=utf-8')
    res.send(html({
      title:       `${user.name ?? req.params.username} | Cannapont`,
      description: (user.bio ?? `Perfil de @${req.params.username} en Cannapont`).slice(0, 160),
      image:       user.avatar || DEFAULT_IMG,
      url,
      type:        'profile',
    }))
  } catch (err) {
    console.error('[OG profile]', err)
    res.status(500).send('Error')
  }
})

module.exports = router
