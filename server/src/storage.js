const path         = require('path')
const fs           = require('fs')
const { randomBytes } = require('crypto')
const multer       = require('multer')

const USE_CLOUD = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
)

if (USE_CLOUD) {
  console.log('[storage] Modo cloud: Cloudflare R2 ✓')
} else {
  console.log('[storage] Modo local: /uploads (dev fallback)')
}

// S3/R2 client — singleton, lazy
let _s3 = null
function getS3() {
  if (_s3) return _s3
  const { S3Client } = require('@aws-sdk/client-s3')
  _s3 = new S3Client({
    region:   'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })
  return _s3
}

/**
 * Crea una instancia de multer con memoryStorage.
 * @param {object} opts
 * @param {number} opts.maxMB   — límite en MB (default 10)
 * @param {function} opts.filter — fileFilter de multer (opcional)
 */
function createUpload({ maxMB = 10, filter = null } = {}) {
  return multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: maxMB * 1024 * 1024 },
    ...(filter ? { fileFilter: filter } : {}),
  })
}

/**
 * Genera una clave única para el archivo.
 * Ej: genKey('videos', 'mi video.mp4') → 'videos/1719000000000-a1b2c3d4.mp4'
 */
function genKey(prefix, originalName) {
  const ext = path.extname(originalName || '').toLowerCase() || '.bin'
  const id  = randomBytes(8).toString('hex')
  return `${prefix}/${Date.now()}-${id}${ext}`
}

/**
 * Sube un Buffer a R2/S3 o lo guarda en disco (dev fallback).
 * Devuelve la URL pública del archivo.
 *
 * @param {Buffer} buffer
 * @param {string} key         — ruta dentro del bucket, ej: 'videos/xxx.mp4'
 * @param {string} contentType — MIME type del archivo
 * @returns {Promise<string>}  — URL pública
 */
async function uploadFile(buffer, key, contentType) {
  if (USE_CLOUD) {
    const { Upload } = require('@aws-sdk/lib-storage')
    const { Readable } = require('stream')

    const up = new Upload({
      client: getS3(),
      params: {
        Bucket:      process.env.R2_BUCKET_NAME,
        Key:         key,
        Body:        Readable.from(buffer),
        ContentType: contentType || 'application/octet-stream',
      },
    })
    await up.done()
    return `${process.env.R2_PUBLIC_URL}/${key}`
  }

  // Fallback local — escribe en /uploads/<key>
  const UPLOADS_DIR = path.join(__dirname, '../../uploads')
  const dir  = path.join(UPLOADS_DIR, path.dirname(key))
  const file = path.join(UPLOADS_DIR, key)

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(file, buffer)

  const base = process.env.BASE_URL || 'http://localhost:4000'
  return `${base}/uploads/${key}`
}

/**
 * Elimina un archivo de R2/S3 dado su URL público.
 * No-op en modo local. No lanza error.
 *
 * @param {string} publicUrl
 */
async function deleteFile(publicUrl) {
  if (!USE_CLOUD || !publicUrl) return
  try {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3')
    const key = new URL(publicUrl).pathname.replace(/^\//, '')
    await getS3().send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key:    key,
    }))
  } catch { /* silencioso — el delete no debe romper el flujo */ }
}

module.exports = { USE_CLOUD, createUpload, genKey, uploadFile, deleteFile }
