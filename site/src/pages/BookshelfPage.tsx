import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchBooks } from '../api'
import type { Book, BookAnimationPhase } from '../types'
import { BookSpine, EmptySlot, FloatingBook } from '../components/Bookshelf'
import '../components/bookshelf.css'

const RETURN_KEY = 'story-returning-book'

export function BookshelfPage() {
  const navigate = useNavigate()
  const [books, setBooks] = useState<Book[]>([])
  const [phase, setPhase] = useState<BookAnimationPhase>('idle')
  const [activeBook, setActiveBook] = useState<Book | null>(null)
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)
  const [returningId, setReturningId] = useState<string | null>(null)

  useEffect(() => {
    fetchBooks().then(setBooks)
  }, [])

  useEffect(() => {
    const returning = sessionStorage.getItem(RETURN_KEY)
    if (returning) {
      sessionStorage.removeItem(RETURN_KEY)
      setReturningId(returning)
      const t = setTimeout(() => setReturningId(null), 900)
      return () => clearTimeout(t)
    }
  }, [])

  const handleSelect = useCallback(
    (book: Book, rect: DOMRect) => {
      if (phase !== 'idle') return
      setActiveBook(book)
      setOriginRect(rect)
      setPhase('pulling')

      setTimeout(() => setPhase('opening'), 700)
      setTimeout(() => setPhase('open'), 1700)
      setTimeout(() => {
        sessionStorage.setItem('story-last-book', book.id)
        navigate(`/book/${book.id}`)
      }, 2400)
    },
    [phase, navigate]
  )

  const emptySlots = Math.max(0, 5 - books.length)

  return (
    <div className="bookshelf-page">
      <div className="bookshelf-page__lamp" />
      <div className="bookshelf-page__ambient" />
      <div className="bookshelf-page__particles">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${10 + Math.random() * 80}%`,
              bottom: `${20 + Math.random() * 40}%`,
              animationDuration: `${6 + Math.random() * 8}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <header className="bookshelf-page__header">
        <h1 className="bookshelf-page__title">古典书架</h1>
        <p className="bookshelf-page__subtitle">无版权名著 · 原文对照 · 读书记</p>
      </header>

      <section className="bookshelf-scene">
        <div className="bookshelf-unit">
          <div className="shelf-frame">
            <div className="shelf-books">
              {books.map((book, i) => (
                <BookSpine
                  key={book.id}
                  book={book}
                  index={i}
                  isActive={activeBook?.id === book.id && phase !== 'idle'}
                  isReturning={returningId === book.id}
                  onSelect={handleSelect}
                />
              ))}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <EmptySlot key={`empty-${i}`} />
              ))}
            </div>
            <div className="shelf-plank" />
          </div>
        </div>
        <p className="bookshelf-page__hint">点击书脊取书阅读</p>
      </section>

      {activeBook && phase !== 'idle' && (
        <FloatingBook book={activeBook} phase={phase} originRect={originRect} />
      )}
    </div>
  )
}
