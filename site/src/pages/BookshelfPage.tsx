import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
      const t = setTimeout(() => setReturningId(null), 1400)
      return () => clearTimeout(t)
    }
  }, [])

  const handleSelect = useCallback(
    (book: Book, rect: DOMRect) => {
      if (phase !== 'idle') return
      setActiveBook(book)
      setOriginRect(rect)
      setPhase('pulling')

      setTimeout(() => setPhase('opening'), 1000)
      setTimeout(() => setPhase('open'), 2400)
      setTimeout(() => {
        sessionStorage.setItem('story-last-book', book.id)
        navigate(`/book/${book.id}`)
      }, 3400)
    },
    [phase, navigate]
  )

  const emptySlots = Math.max(0, 5 - books.length)

  return (
    <div className="bookshelf-page">
      <div className="bookshelf-page__lamp" />
      <div className="bookshelf-page__ambient" />
      <div className="bookshelf-page__vignette" />
      <div className="bookshelf-page__particles">
        {Array.from({ length: 36 }).map((_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${5 + Math.random() * 90}%`,
              bottom: `${10 + Math.random() * 50}%`,
              animationDuration: `${8 + Math.random() * 10}s`,
              animationDelay: `${Math.random() * 6}s`,
            }}
          />
        ))}
      </div>

      <motion.header
        className="bookshelf-page__header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="bookshelf-page__title">古典书架</h1>
        <p className="bookshelf-page__subtitle">无版权名著 · 原文对照 · 读书记</p>
      </motion.header>

      <section className="bookshelf-scene">
        <motion.div
          className="bookshelf-wall"
          initial={{ opacity: 0, y: 60, rotateX: 15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="bookshelf-cabinet">
            <div className="shelf-crown" />
            <div className="shelf-body">
              <div className="shelf-side shelf-side--left" />
              <div className="shelf-main">
                <div className="shelf-frame">
                  <div className="shelf-frame__light" />
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
              <div className="shelf-side shelf-side--right" />
            </div>
            <div className="shelf-base" />
          </div>
          <div className="bookshelf-floor" />
        </motion.div>
        <p className="bookshelf-page__hint">点击书脊 · 取书阅读</p>
      </section>

      {activeBook && phase !== 'idle' && (
        <FloatingBook book={activeBook} phase={phase} originRect={originRect} />
      )}
    </div>
  )
}
