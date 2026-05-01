import { Helmet } from 'react-helmet-async'

const DEFAULT = {
  title:       'Cannapont | Comprá, Mostrá, Ganá',
  description: 'El marketplace donde tus videos generan comisiones automáticas.',
  image:       'https://cannapont.vercel.app/og-default.png',
  url:         'https://cannapont.vercel.app',
}

export default function SEO({ title, description, image, url, type = 'website' }) {
  const t   = title       ? `${title} | Cannapont` : DEFAULT.title
  const d   = description ?? DEFAULT.description
  const img = image       ?? DEFAULT.image
  const u   = url         ?? DEFAULT.url

  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />

      {/* Open Graph */}
      <meta property="og:type"        content={type} />
      <meta property="og:title"       content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:image"       content={img} />
      <meta property="og:url"         content={u} />
      <meta property="og:site_name"   content="Cannapont" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image"       content={img} />
    </Helmet>
  )
}
