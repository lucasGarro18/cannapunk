const fs   = require('fs')
const path = require('path')

const REPLACEMENTS = [
  // Vocales minúsculas con tilde
  [/Ã¡/g, 'á'], [/Ã©/g, 'é'], [/Ã­/g, 'í'], [/Ã³/g, 'ó'], [/Ãº/g, 'ú'],
  // Vocales mayúsculas con tilde
  [/Ã\u0081/g, 'Á'], [/Ã‰/g, 'É'], [/Ã\u008D/g, 'Í'], [/Ã"/g, 'Ó'], [/Ãš/g, 'Ú'],
  // Ñ y ü
  [/Ã±/g, 'ñ'], [/Ã'/g, 'Ñ'], [/Ã¼/g, 'ü'],
  // Puntuación especial
  [/Â¡/g, '¡'], [/Â¿/g, '¿'], [/Â°/g, '°'], [/Â·/g, '·'],
  [/Â©/g, '©'], [/Â®/g, '®'], [/Â½/g, '½'], [/Â¼/g, '¼'],
  // Comillas y guiones
  [/â€œ/g, '"'], [/â€\u009D/g, '"'], [/â€™/g, "'"], [/â€˜/g, "'"],
  [/â€"/g, '—'], [/â€"/g, '–'],
  // Líneas decorativas (usadas en comentarios JSX)
  [/â"€/g, '─'], [/â"‚/g, '│'],
  // Bullet y símbolos
  [/â—/g, '●'], [/âˆ'/g, '−'],
  // Espacios y caracteres raros
  [/Â\s/g, ' '], [/Â$/g, ''],
]

const EXTS = ['.jsx', '.js', '.ts', '.tsx', '.css', '.html']

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let changed = false
  for (const [pattern, replacement] of REPLACEMENTS) {
    const next = content.replace(pattern, replacement)
    if (next !== content) { content = next; changed = true }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log('✓', path.relative(process.cwd(), filePath))
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory() && !['node_modules', '.git', 'dist'].includes(entry.name)) {
      walk(full)
    } else if (entry.isFile() && EXTS.includes(path.extname(entry.name))) {
      fixFile(full)
    }
  }
}

walk(path.join(__dirname, 'src'))
console.log('\n✅ Listo')
