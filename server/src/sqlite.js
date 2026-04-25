// SQLite compat helpers — serialize/deserialize fields that Postgres stored as native arrays/JSON

function serializeRoles(roles) {
  return Array.isArray(roles) ? roles.join(',') : (roles ?? 'buyer')
}

function deserializeRoles(rolesStr) {
  if (!rolesStr) return ['buyer']
  return rolesStr.split(',').filter(Boolean)
}

function serializeAddress(address) {
  return typeof address === 'string' ? address : JSON.stringify(address ?? {})
}

function deserializeAddress(str) {
  if (!str) return {}
  try { return JSON.parse(str) } catch { return {} }
}

function serializeTags(tags) {
  return Array.isArray(tags) ? JSON.stringify(tags) : (tags ?? '[]')
}

function deserializeTags(str) {
  if (!str) return []
  try { return JSON.parse(str) } catch { return [] }
}

// Apply deserialization to a user object (or array of users)
function fixUser(u) {
  if (!u) return u
  return { ...u, roles: deserializeRoles(u.roles) }
}

function fixUsers(arr) { return arr.map(fixUser) }

function fixOrder(o) {
  if (!o) return o
  return {
    ...o,
    address: deserializeAddress(o.address),
    items: (o.items ?? []).map(i => ({
      ...i,
      product: i.product ? fixProduct(i.product) : i.product,
    })),
    buyer:     o.buyer     ? fixUser(o.buyer)     : o.buyer,
    deliverer: o.deliverer ? fixUser(o.deliverer) : o.deliverer,
  }
}

function fixOrders(arr) { return arr.map(fixOrder) }

function fixProduct(p) {
  if (!p) return p
  return {
    ...p,
    seller: p.seller ? fixUser(p.seller) : p.seller,
  }
}

function fixProducts(arr) { return arr.map(fixProduct) }

function fixVideo(v) {
  if (!v) return v
  return {
    ...v,
    tags:    deserializeTags(v.tags),
    creator: v.creator ? fixUser(v.creator) : v.creator,
  }
}

function fixVideos(arr) { return arr.map(fixVideo) }

module.exports = {
  serializeRoles, deserializeRoles,
  serializeAddress, deserializeAddress,
  serializeTags, deserializeTags,
  fixUser, fixUsers,
  fixOrder, fixOrders,
  fixProduct, fixProducts,
  fixVideo, fixVideos,
}
