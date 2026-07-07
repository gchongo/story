import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchBookMeta, fetchChapters } from '../api'
import { FloatingBook } from '../components/Bookshelf'
import type { BookMeta, Chapter } from '../types'
import '../components/bookshelf.css'
import './book.css'

const RETURN_KEY = 'story-returning-book'

export function BookPage() {
  const { bookId } = useParams<{ bookId: string }>()
  const navigate = useNavigate()
  const [meta, setMeta] = useState<BookMeta | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [query, setQuery] = useState('')
  const [closingPhase, setClosingPhase] = useState<'idle' | 'closing' | 'returning'>('idle')

  useEffect(() => {
    if (!bookId) return
    Promise.all([fetchBookMeta(bookId), fetchChapters(bookId)]).then(([m, c]) => {
      setMeta(m)
      setChapters(c)
    })
  }, [bookId])

  const filtered = useMemo(() => {
    if (!query.trim()) return chapters
    const q = query.trim().toLowerCase()
    return chapters.filter((c) => c.title.toLowerCase().includes(q) || c.id.includes(q))
  }, [chapters, query])

  const handleBack = () => {
    if (closingPhase !== 'idle') return
    setClosingPhase('closing')
    setTimeout(() => setClosingPhase('returning'), 900)
    if (bookId) sessionStorage.setItem(RETURN_KEY, bookId)
    setTimeout(() => navigate('/'), 2200)
  }

  if (!meta) {
    return (
      <div className="book-page">
        <div className="book-page__content">加载中…</div>
      </div>
    )
  }

  return (
    <div className={`book-page ${closingPhase !== 'idle' ? 'book-page--closing' : ''}`}>
      <nav className="book-page__nav">
        <button type="button" className="book-page__back" onClick={handleBack}>
          ← 放回书架
        </button>
        <div className="book-page__info">
          <h1 className="book-page__title">
            {meta.title}
            <span style={{ fontSize: '0.9rem', marginLeft: '0.5rem', opacity: 0.6 }}>{meta.subtitle}</span>
          </h1>
          <p className="book-page__meta">
            {meta.dynasty} · {meta.author} · 共 {meta.chapterCount} 章
          </p>
        </div>
        {meta.hasVernacular && (
          <span className="book-page__progress">
            白话 {meta.vernacularCount}/{meta.chapterCount}
          </span>
        )}
      </nav>

      <div className="book-page__content">
        <input
          className="chapter-search"
          type="search"
          placeholder="搜索章节…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="chapter-list">
          {filtered.map((ch) => (
            <li key={ch.id} className="chapter-item">
              <Link className="chapter-link" to={`/book/${bookId}/read/${ch.id}`}>
                <span className="chapter-link__num">{ch.id}</span>
                <span className="chapter-link__title">{ch.title}</span>
                {ch.hasVernacular ? (
                  <span className="chapter-link__badge">已译</span>
                ) : (
                  <span className="chapter-link__badge chapter-link__badge--pending">原文</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {meta && closingPhase !== 'idle' && (
        <FloatingBook book={meta} phase={closingPhase} originRect={null} />
      )}
    </div>
  )
}
