const nodemailer = require('nodemailer')

let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null
  _transporter = nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT) === 465,
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
  })
  return _transporter
}

const FROM = () => process.env.SMTP_FROM ?? `Cannapont <noreply@cannapont.com>`

const ARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0c0c0e; color: #e4e4e7; margin: 0; padding: 0;
`

function layout(body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>
<body style="${BASE_STYLE}">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:32px auto">
    <tr><td style="padding:0 24px">
      <div style="font-size:22px;font-weight:700;color:#f59e0b;margin-bottom:24px">⚡ Cannapont</div>
      ${body}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #27272a;font-size:11px;color:#52525b">
        © ${new Date().getFullYear()} Cannapont — No respondas este email.
      </div>
    </td></tr>
  </table>
</body></html>`
}

function btnPrimary(href, label) {
  return `<a href="${href}" style="display:inline-block;background:#f59e0b;color:#0c0c0e;
    font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;text-decoration:none;margin-top:20px">
    ${label}
  </a>`
}

// ── Email: orden confirmada ────────────────────────────────────
async function sendOrderConfirmation({ to, name, orderId, items, total }) {
  const t = getTransporter()
  if (!t) return

  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1c1c1f">
        <span style="font-size:13px">${i.product?.name ?? 'Producto'}</span>
        <span style="color:#71717a;font-size:12px"> × ${i.qty}</span>
      </td>
      <td style="text-align:right;padding:10px 0;border-bottom:1px solid #1c1c1f;font-weight:600;font-size:13px">
        ${ARS(i.unitPrice * i.qty)}
      </td>
    </tr>`).join('')

  const html = layout(`
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px">Pedido confirmado ✅</h1>
    <p style="color:#a1a1aa;margin:0 0 24px">Hola ${name}, tu pedido fue recibido.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
      <thead>
        <tr>
          <th style="text-align:left;font-size:11px;color:#71717a;padding-bottom:8px;border-bottom:1px solid #27272a">PRODUCTO</th>
          <th style="text-align:right;font-size:11px;color:#71717a;padding-bottom:8px;border-bottom:1px solid #27272a">SUBTOTAL</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr>
          <td style="padding-top:12px;font-weight:700">Total</td>
          <td style="text-align:right;padding-top:12px;font-weight:700;color:#f59e0b;font-size:16px">${ARS(total)}</td>
        </tr>
      </tfoot>
    </table>

    <p style="font-size:12px;color:#71717a;margin:16px 0 0">N° de pedido: <code style="color:#a1a1aa">#${orderId.slice(-8).toUpperCase()}</code></p>
    ${btnPrimary(`${process.env.CLIENT_URL ?? 'http://localhost:5173'}/orders`, 'Ver mis pedidos')}
  `)

  await t.sendMail({
    from:    FROM(),
    to,
    subject: `Pedido confirmado — ${ARS(total)}`,
    html,
  })
}

// ── Email: comisión pagada ─────────────────────────────────────
async function sendCommissionPaid({ to, name, amount }) {
  const t = getTransporter()
  if (!t) return

  const html = layout(`
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px">¡Comisión acreditada! 💰</h1>
    <p style="color:#a1a1aa;margin:0 0 24px">Hola ${name}, tu pago fue procesado.</p>

    <div style="background:#1c1c1f;border:1px solid #27272a;border-radius:16px;padding:24px;text-align:center">
      <p style="margin:0 0 4px;color:#a1a1aa;font-size:13px">Monto acreditado</p>
      <p style="margin:0;font-size:32px;font-weight:700;color:#f59e0b">${ARS(amount)}</p>
    </div>

    ${btnPrimary(`${process.env.CLIENT_URL ?? 'http://localhost:5173'}/wallet`, 'Ver mi billetera')}
  `)

  await t.sendMail({
    from:    FROM(),
    to,
    subject: `Tu comisión de ${ARS(amount)} fue acreditada`,
    html,
  })
}

// ── Email: bienvenida al registrarse ──────────────────────────
async function sendWelcome({ to, name }) {
  const t = getTransporter()
  if (!t) return

  const html = layout(`
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px">Bienvenido a Cannapont ⚡</h1>
    <p style="color:#a1a1aa;margin:0 0 24px">Hola ${name}, tu cuenta está lista.</p>

    <p style="font-size:14px;line-height:1.6;color:#d4d4d8">
      Explorá el marketplace, comprá productos y empezá a ganar comisiones subiendo reviews en video.
    </p>

    ${btnPrimary(`${process.env.CLIENT_URL ?? 'http://localhost:5173'}`, 'Ir a Cannapont')}
  `)

  await t.sendMail({
    from:    FROM(),
    to,
    subject: 'Bienvenido a Cannapont',
    html,
  })
}

module.exports = { sendOrderConfirmation, sendCommissionPaid, sendWelcome }
