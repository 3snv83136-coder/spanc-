import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const appPublic = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const enteteSrc = join(root, 'image.png')
const maisonSrc = join(root, 'maison.jpg')

if (!existsSync(enteteSrc)) {
  console.warn('image.png introuvable à la racine — en-tête SPANC non copié.')
} else {
  mkdirSync(join(appPublic, 'demo'), { recursive: true })
  copyFileSync(enteteSrc, join(appPublic, 'entete-spanc.png'))
  console.log('En-tête SPANC → public/entete-spanc.png')
}

if (existsSync(maisonSrc)) {
  mkdirSync(join(appPublic, 'demo'), { recursive: true })
  copyFileSync(maisonSrc, join(appPublic, 'demo', 'maison-villeneuve.jpg'))
  console.log('Photo bien → public/demo/maison-villeneuve.jpg')
} else if (existsSync(enteteSrc)) {
  mkdirSync(join(appPublic, 'demo'), { recursive: true })
  copyFileSync(enteteSrc, join(appPublic, 'demo', 'maison-villeneuve.jpg'))
  console.warn('maison.jpg absent — placeholder démo utilisé pour la photo du bien.')
}
