/**
 * Génère les icônes PWA statiques à partir du favicon Next (/icon).
 * Exécuter après `npm run build` ou en dev avec le serveur lancé.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const iconsDir = path.join(root, 'public', 'icons')
const baseUrl = process.env.SPANC_ICON_URL || 'http://localhost:3000/icon'

async function fetchIcon(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Impossible de récupérer ${url} (${res.status})`)
  return Buffer.from(await res.arrayBuffer())
}

async function resizeWithSips(inputPath, outputPath, size) {
  execSync(`sips -z ${size} ${size} "${inputPath}" --out "${outputPath}"`, { stdio: 'inherit' })
}

async function main() {
  await mkdir(iconsDir, { recursive: true })
  const tmp512 = path.join(iconsDir, '_tmp-512.png')

  try {
    const buf = await fetchIcon(baseUrl)
    await writeFile(tmp512, buf)
  } catch {
    console.warn('Serveur indisponible — génération locale via sips sur logo.png')
    const logo = path.join(root, 'public', 'logo.png')
    execSync(`sips -z 512 512 "${logo}" --out "${tmp512}"`, { stdio: 'inherit' })
  }

  await resizeWithSips(tmp512, path.join(iconsDir, 'icon-512.png'), 512)
  await resizeWithSips(tmp512, path.join(iconsDir, 'icon-512-maskable.png'), 512)
  await resizeWithSips(tmp512, path.join(iconsDir, 'icon-192.png'), 192)

  console.log('Icônes PWA générées dans public/icons/')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
