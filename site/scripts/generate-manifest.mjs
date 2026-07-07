import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
const outDir = path.resolve(__dirname, '../public/data')

const books = JSON.parse(fs.readFileSync(path.join(root, 'books.json'), 'utf-8'))

function listChapters(bookPath) {
  const dir = path.join(root, bookPath, '章节')
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.txt') && !f.startsWith('000_'))
    .sort()
    .map((filename) => {
      const match = filename.match(/^(\d+)_(.+)\.txt$/)
      const id = match?.[1] ?? filename.replace('.txt', '')
      const title = match?.[2] ?? filename
      const vernacularPath = path.join(root, bookPath, '白话文', '章节', filename)
      return {
        id,
        filename,
        title: title.replace(/_/g, ' '),
        hasVernacular: fs.existsSync(vernacularPath),
      }
    })
}

fs.mkdirSync(outDir, { recursive: true })
fs.copyFileSync(path.join(root, 'books.json'), path.join(outDir, 'books.json'))

for (const book of books.books) {
  const bookDir = path.join(outDir, book.id)
  fs.mkdirSync(bookDir, { recursive: true })

  const chapters = listChapters(book.path)
  const vernacularCount = chapters.filter((c) => c.hasVernacular).length

  fs.writeFileSync(
    path.join(bookDir, 'meta.json'),
    JSON.stringify({ ...book, vernacularCount, chapterCount: chapters.length }, null, 2)
  )
  fs.writeFileSync(path.join(bookDir, 'chapters.json'), JSON.stringify(chapters, null, 2))
}

console.log(`Generated manifests for ${books.books.length} books → ${outDir}`)
