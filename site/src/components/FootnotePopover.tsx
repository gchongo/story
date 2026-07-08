import { useEffect, useRef } from 'react'
import type { FootnoteMap } from './ReaderContent'

export interface FootnotePopoverState {
  key: string
  left: number
  top: number
  above: boolean
}

export function calcPopoverPosition(el: HTMLElement): Omit<FootnotePopoverState, 'key'> {
  const rect = el.getBoundingClientRect()
  const popoverW = 300
  const gap = 10
  const estimatedH = 120

  let above = false
  let top = rect.bottom + gap
  if (top + estimatedH > window.innerHeight - 12) {
    top = rect.top - gap
    above = true
  }

  let left = rect.left + rect.width / 2
  const minLeft = popoverW / 2 + 12
  const maxLeft = window.innerWidth - popoverW / 2 - 12
  left = Math.max(minLeft, Math.min(left, maxLeft))

  return { left, top, above }
}

interface FootnotePopoverProps {
  popover: FootnotePopoverState | null
  footnotes: FootnoteMap
  onClose: () => void
}

export function FootnotePopover({ popover, footnotes, onClose }: FootnotePopoverProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!popover) return
    const onScroll = () => onClose()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onClose)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('keydown', onKey)
    }
  }, [popover, onClose])

  if (!popover || !footnotes[popover.key]) return null

  return (
    <>
      <div className="reader-fn-backdrop" onClick={onClose} aria-hidden />
      <div
        ref={cardRef}
        className={`reader-fn-popover ${popover.above ? 'reader-fn-popover--above' : 'reader-fn-popover--below'}`}
        style={{ left: popover.left, top: popover.top }}
        role="dialog"
        aria-label="脂批注释"
      >
        <div className="reader-fn-popover__arrow" />
        <div className="reader-fn-popover__header">
          <span className="reader-fn-popover__id">{popover.key}</span>
          <span className="reader-fn-popover__label">脂批注释</span>
          <button type="button" className="reader-fn-popover__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <p className="reader-fn-popover__text">{footnotes[popover.key]}</p>
      </div>
    </>
  )
}
