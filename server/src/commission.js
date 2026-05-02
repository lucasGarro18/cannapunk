// Calcula la comisión que recibe el creador después del platform fee.
// PLATFORM_FEE = porcentaje que retiene la plataforma (ej: 0.08 = 8%).
// Si no está configurado, el creador recibe el 100% de la comisión.
const PLATFORM_FEE = Math.min(0.5, Math.max(0, parseFloat(process.env.PLATFORM_FEE ?? '0')))

function creatorCommission(orderTotal, commissionPct) {
  const gross = Math.round(orderTotal * commissionPct / 100)
  return Math.round(gross * (1 - PLATFORM_FEE))
}

module.exports = { creatorCommission, PLATFORM_FEE }
