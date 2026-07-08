import type { Book, BookMeta, Chapter } from './types'

export type { ContentBlock, FootnoteMap } from './components/ReaderContent'
export { parseReaderContent, parseOriginalContent, parseOriginalChapter, extractFootnotes } from './components/ReaderContent'

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
