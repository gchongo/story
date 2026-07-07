import type { MouseEvent } from 'react'
import { motion } from 'framer-motion'
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
            ? { opacity: 0, scale: 0.8, y: -20 }
            : isReturning
              ? { opacity: [0, 1], scale: [0.85, 1], y: [30, 0] }
              : { opacity: 1, scale: 1, y: 0, rotateY: 0, z: 0 }
        }
        whileHover={!isActive ? { y: -12, rotateY: -18, z: 30 } : undefined}
        transition={{
          duration: isReturning ? 0.7 : 0.35,
          delay: isReturning ? index * 0.05 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
        onClick={handleClick}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="book-spine__face book-spine__face--front"
          style={{
            backgroundColor: book.spineColor,
            borderLeft: `4px solid ${book.accentColor}`,
          }}
        >
          <span className="book-spine__title">{book.title}</span>
          <span className="book-spine__author">{book.author}</span>
        </div>
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

  const isOpen = phase === 'open' || phase === 'opening'
  const coverRotate =
    phase === 'opening' || phase === 'open'
      ? -160
      : phase === 'closing'
        ? 0
        : phase === 'returning'
          ? 0
          : 0
  const pageRotate =
    phase === 'opening' ? -120 : phase === 'open' ? -160 : phase === 'closing' ? -80 : 0

  return (
    <div className="floating-book-overlay">
      <motion.div
        className="floating-book"
        initial={{
          x: originX - centerX,
          y: originY - centerY,
          scale: 0.35,
          rotateY: -25,
        }}
        animate={{
          x: phase === 'returning' ? originX - centerX : 0,
          y: phase === 'returning' ? originY - centerY : 0,
          scale: phase === 'returning' ? 0.35 : phase === 'pulling' ? 0.7 : 1,
          rotateY: phase === 'returning' ? -25 : 0,
          opacity: phase === 'returning' ? 0 : 1,
        }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="floating-book__pages">
          <div className="page-flip-lines">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
        </div>

        <motion.div
          className="floating-book__page-flip"
          animate={{ rotateY: isOpen ? pageRotate : 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: phase === 'opening' ? 0.3 : 0 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="page-flip-lines">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
        </motion.div>

        <motion.div
          className="floating-book__cover"
          style={{
            background: `linear-gradient(135deg, ${book.spineColor} 0%, ${book.spineColor}dd 50%, ${book.accentColor}44 100%)`,
            borderLeft: `6px solid ${book.accentColor}`,
            transformStyle: 'preserve-3d',
          }}
          animate={{ rotateY: coverRotate }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: phase === 'opening' ? 0.15 : 0 }}
        >
          <span className="floating-book__cover-title">{book.title}</span>
          <span className="floating-book__cover-sub">{book.subtitle}</span>
          <p className="floating-book__cover-desc">{book.description}</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

interface EmptySlotProps {
  label?: string
}

export function EmptySlot({ label = '待上架' }: EmptySlotProps) {
  return <div className="book-spine--empty">{label}</div>
}
