import type { MouseEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Book } from '../types'
import './bookshelf.css'

interface BookSpineProps {
  book: Book
  index: number
  isActive: boolean
  isReturning: boolean
  onSelect: (book: Book, rect: DOMRect) => void
}

export function BookSpine({ book, index, isActive, isReturning, onSelect }: BookSpineProps) {
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onSelect(book, rect)
  }

  return (
    <div className="book-slot">
      <motion.div
        className={`book-spine ${isActive ? 'book-spine--active' : ''}`}
        initial={false}
        animate={
          isActive
            ? { opacity: 0, scale: 0.6, y: -40, z: 120, rotateY: -30 }
            : isReturning
              ? { opacity: [0, 1], scale: [0.7, 1.05, 1], y: [60, -8, 0], rotateY: [20, -5, 0] }
              : { opacity: 1, scale: 1, y: 0, rotateY: 0, z: 0 }
        }
        whileHover={!isActive ? { y: -18, rotateY: -22, z: 45, scale: 1.03 } : undefined}
        transition={{
          duration: isReturning ? 1.1 : 0.45,
          delay: isReturning ? index * 0.06 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
        onClick={handleClick}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="book-spine__pages-edge" />
        <div
          className="book-spine__face book-spine__face--front"
          style={{
            background: `linear-gradient(180deg, ${book.spineColor}ee 0%, ${book.spineColor} 45%, ${book.spineColor}cc 100%)`,
            borderLeft: `5px solid ${book.accentColor}`,
            boxShadow: `inset 0 0 20px ${book.accentColor}33`,
          }}
        >
          <div className="book-spine__ornament" style={{ borderColor: book.accentColor }} />
          <span className="book-spine__title">{book.title}</span>
          <span className="book-spine__author">{book.author}</span>
          <div className="book-spine__seal" style={{ color: book.accentColor, borderColor: book.accentColor }}>
            讀
          </div>
        </div>
        <div className="book-spine__top" style={{ background: book.spineColor }} />
        <div className="book-spine__shadow" />
      </motion.div>
    </div>
  )
}

interface FloatingBookProps {
  book: Book
  phase: 'pulling' | 'opening' | 'open' | 'closing' | 'returning'
  originRect: DOMRect | null
}

export function FloatingBook({ book, phase, originRect }: FloatingBookProps) {
  const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0
  const originX = originRect ? originRect.left + originRect.width / 2 : centerX
  const originY = originRect ? originRect.top + originRect.height / 2 : centerY
  const isClosing = phase === 'closing' || phase === 'returning'
  const isOpen = phase === 'open' || phase === 'opening'

  const coverRotate =
    phase === 'opening' || phase === 'open' ? -168 : phase === 'closing' ? -90 : 0

  const pageRotations = [
    phase === 'opening' ? -45 : phase === 'open' ? -155 : phase === 'closing' ? -60 : 0,
    phase === 'opening' ? -90 : phase === 'open' ? -140 : phase === 'closing' ? -40 : 0,
    phase === 'opening' ? -130 : phase === 'open' ? -120 : phase === 'closing' ? -20 : 0,
  ]

  return (
    <div className="floating-book-overlay">
      <motion.div
        className="floating-book-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing && phase === 'returning' ? 0 : 0.92 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      />

      <motion.div
        className="floating-book-glow"
        style={{ background: `radial-gradient(circle, ${book.accentColor}55 0%, transparent 70%)` }}
        animate={{
          opacity: isOpen ? 0.8 : 0.3,
          scale: isOpen ? 1.2 : 0.8,
        }}
        transition={{ duration: 1.2 }}
      />

      <motion.div
        className="floating-book"
        initial={{
          x: originX - centerX,
          y: originY - centerY,
          scale: 0.25,
          rotateY: -35,
          rotateX: 12,
        }}
        animate={{
          x: phase === 'returning' ? originX - centerX : 0,
          y: phase === 'returning' ? originY - centerY + 40 : phase === 'pulling' ? -30 : 0,
          scale:
            phase === 'returning'
              ? 0.2
              : phase === 'pulling'
                ? 0.55
                : phase === 'opening'
                  ? 0.85
                  : 1,
          rotateY: phase === 'returning' ? -40 : phase === 'pulling' ? -8 : 0,
          rotateX: phase === 'returning' ? 18 : phase === 'open' ? -2 : 4,
          opacity: phase === 'returning' ? 0 : 1,
        }}
        transition={{
          duration: phase === 'returning' ? 1.2 : phase === 'opening' ? 1.4 : 0.9,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="floating-book__back" style={{ background: book.spineColor }} />
        <div className="floating-book__pages-stack">
          <div className="floating-book__pages">
            <div className="page-flip-lines">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} />
              ))}
            </div>
          </div>
          {pageRotations.map((rot, i) => (
            <motion.div
              key={i}
              className="floating-book__page-flip"
              style={{ zIndex: 10 + i }}
              animate={{ rotateY: rot }}
              transition={{
                duration: phase === 'closing' ? 0.5 : 0.85,
                delay: phase === 'opening' ? 0.2 + i * 0.12 : phase === 'closing' ? i * 0.08 : 0,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="page-flip-lines">
                {Array.from({ length: 12 }).map((_, j) => (
                  <span key={j} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="floating-book__cover"
          style={{
            background: `linear-gradient(145deg, ${book.spineColor} 0%, ${book.spineColor}aa 40%, ${book.accentColor}33 100%)`,
            borderLeft: `8px solid ${book.accentColor}`,
            transformStyle: 'preserve-3d',
          }}
          animate={{ rotateY: coverRotate }}
          transition={{
            duration: phase === 'closing' ? 0.7 : 1.1,
            ease: [0.22, 1, 0.36, 1],
            delay: phase === 'opening' ? 0.35 : 0,
          }}
        >
          <div className="floating-book__cover-frame" style={{ borderColor: book.accentColor }} />
          <span className="floating-book__cover-title">{book.title}</span>
          <span className="floating-book__cover-sub">{book.subtitle}</span>
          <p className="floating-book__cover-desc">{book.description}</p>
          <div className="floating-book__cover-seal" style={{ borderColor: book.accentColor, color: book.accentColor }}>
            {book.dynasty}
          </div>
        </motion.div>

        <div className="floating-book__spine" style={{ background: book.spineColor }} />
      </motion.div>

      <AnimatePresence>
        {(phase === 'opening' || phase === 'open') && (
          <motion.div
            className="floating-book__sparkles"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.span
                key={i}
                className="sparkle"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${25 + Math.random() * 50}%`,
                  background: book.accentColor,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  y: [0, -30 - Math.random() * 40],
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.5 + i * 0.1,
                  repeat: phase === 'open' ? 0 : Infinity,
                  repeatDelay: 2,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface EmptySlotProps {
  label?: string
}

export function EmptySlot({ label = '待上架' }: EmptySlotProps) {
  return (
    <div className="book-spine--empty">
      <span>{label}</span>
    </div>
  )
}
