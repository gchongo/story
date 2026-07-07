import type { Book, BookMeta, Chapter } from './types'

const DATA = '/data'

export async function fetchBooks(): Promise<Book[]> {
  const res = await fetch(`${DATA}/books.json`)
  const data = await res.json()
  return data.books
}

export async function fetchBookMeta(id: string): Promise<BookMeta> {
  const res = await fetch(`${DATA}/${id}/meta.json`)
  return res.json()
}

export async function fetchChapters(id: string): Promise<Chapter[]> {
  const res = await fetch(`${DATA}/${id}/chapters.json`)
  return res.json()
}

export async function fetchChapterText(
  bookPath: string,
  kind: 'original' | 'vernacular',
  filename: string
): Promise<string> {
  const folder = kind === 'original' ? '章节' : '白话文/章节'
  const encoded = [bookPath, folder, filename].map((s) => encodeURIComponent(s)).join('/')
  const res = await fetch(`/content/${encoded}`)
  if (!res.ok) throw new Error(`无法加载：${filename}`)
  return res.text()
}

export function parseReaderContent(text: string) {
  const lines = text.split('\n')
  const blocks: { type: 'text' | 'zhipi' | 'note' | 'heading'; content: string }[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (blocks.length && blocks[blocks.length - 1].type === 'text') {
        blocks[blocks.length - 1].content += '\n'
      }
      continue
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'heading', content: trimmed.slice(2) })
    } else if (trimmed.startsWith('> 【读书记】')) {
      blocks.push({ type: 'note', content: trimmed.slice(8).trim() })
    } else if (trimmed.startsWith('> 【脂批') || trimmed.startsWith('> 【批')) {
      blocks.push({ type: 'zhipi', content: trimmed.replace(/^>\s*/, '') })
    } else if (trimmed.startsWith('>')) {
      blocks.push({ type: 'zhipi', content: trimmed.slice(1).trim() })
    } else if (trimmed.startsWith('《') && trimmed.endsWith('》')) {
      blocks.push({ type: 'heading', content: trimmed })
    } else {
      const last = blocks[blocks.length - 1]
      if (last?.type === 'text') {
        last.content += (last.content.endsWith('\n') ? '' : '\n') + line
      } else {
        blocks.push({ type: 'text', content: line })
      }
    }
  }

  return blocks
}

export function parseOriginalContent(text: string) {
  const lines = text.split('\n')
  const blocks: { type: 'text' | 'zhipi' | 'heading' | 'poem'; content: string }[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('===')) continue

    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'heading', content: trimmed.slice(2) })
    } else if (trimmed.startsWith('>')) {
      blocks.push({ type: 'zhipi', content: trimmed.slice(1).trim() })
    } else if (/^[\u3000\s]*[，。、；：！？\u2014\u2026\u300a\u300b「」]/.test(trimmed) === false && /[。，；：！？]/.test(trimmed) && trimmed.length < 80 && /^[\u3000\s]/.test(line)) {
      blocks.push({ type: 'poem', content: trimmed })
    } else {
      const last = blocks[blocks.length - 1]
      if (last?.type === 'text') {
        last.content += '\n' + line
      } else {
        blocks.push({ type: 'text', content: line })
      }
    }
  }

  return blocks
}
