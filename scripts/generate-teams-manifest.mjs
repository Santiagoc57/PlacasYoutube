import fs from 'fs/promises'
import path from 'path'

function toTitleCase(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

async function main() {
  const root = process.cwd()
  const publicDir = path.join(root, 'public')
  const candidates = [
    { dir: path.join(publicDir, 'Logos equipos'), baseUrl: '/Logos%20equipos/' },
    { dir: path.join(publicDir, 'logos-equipos'), baseUrl: '/logos-equipos/' },
    { dir: path.join(publicDir, 'logos equipos'), baseUrl: '/logos%20equipos/' },
  ]

  let result = { baseUrl: '', teams: [] }

  for (const c of candidates) {
    try {
      const entries = await fs.readdir(c.dir, { withFileTypes: true })
      const files = entries
        .filter((e) => e.isFile())
        .map((e) => e.name)
        .filter((n) => /\.(png|jpg|jpeg|webp|svg)$/i.test(n))

      if (files.length === 0) continue

      result.baseUrl = c.baseUrl
      result.teams = files.map((file) => {
        const base = file.replace(/\.(png|jpg|jpeg|webp|svg)$/i, '')
        const name = toTitleCase(base)
        return { name, file, logo: `${c.baseUrl}${file}` }
      })
      break
    } catch (e) {
      // try next
    }
  }

  const outPath = path.join(publicDir, 'teams.manifest.json')
  await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf8')
  console.log(`Generated ${outPath} with ${result.teams.length} teams`)
}

main().catch((e) => {
  console.error('Failed to generate teams.manifest.json', e)
  process.exit(0)
})
