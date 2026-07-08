import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchBookMeta,
  fetchChapters,
  fetchChapterText,
  parseOriginalChapter,
  parseReaderContent,
} from '../api'
import { ReaderBlocks, FootnoteBar } from '../components/ReaderBlocks'
import type { BookMeta, Chapter } from '../types'
import './reader.css'

export function ReaderPage() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>()
  const navigate = useNavigate()
  const [meta, setMeta] = useState<BookMeta | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [original, setOriginal] = useState('')
  const [vernacular, setVernacular] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFn, setActiveFn] = useState<string | null>(null)

  const chapter = chapters.find((c) => c.id === chapterId)
  const chapterIndex = chapters.findIndex((c) => c.id === chapterId)
  const prev = chapterIndex > 0 ? chapters[chapterIndex - 1] : null
  const next = chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1] : null

  useEffect(() => {
    if (!bookId) return
    Promise.all([fetchBookMeta(bookId), fetchChapters(bookId)]).then(([m, c]) => {
      setMeta(m)
      setChapters(c)
    })
  }, [bookId])

  useEffect(() => {
    if (!bookId || !chapterId || !meta) return
    const ch = chapters.find((c) => c.id === chapterId)
    if (!ch) return

    setLoading(true)
    setActiveFn(null)
    const tasks: Promise<void>[] = [
      fetchChapterText(meta.path, 'original', ch.filename).then(setOriginal),
    ]
    if (ch.hasVernacular) {
      tasks.push(fetchChapterText(meta.path, 'vernacular', ch.filename).then(setVernacular))
    } else {
      setVernacular(null)
    }
    Promise.all(tasks).finally(() => setLoading(false))
  }, [bookId, chapterId, meta, chapters])

  if (loading || !meta) {
    return <div className="reader-loading">正在展开书页…</div>
  }

  const { blocks: originalBlocks, footnotes } = parseOriginalChapter(original)
  const vernacularBlocks = vernacular ? parseReaderContent(vernacular) : null
  const hasVernacular = !!vernacularBlocks?.length

  const handleFnClick = useCallback((key: string) => {
    setActiveFn((prev) => (prev === key ? null : key))
  }, [])

  return (
    <div className={`reader-page ${!hasVernacular ? 'reader-single' : ''}`}>
      <nav className="reader-nav">
        <Link className="reader-nav__back" to={`/book/${bookId}`}>
          目录
        </Link>
        <h2 className="reader-nav__title">{chapter?.title ?? `第 ${chapterId} 章`}</h2>
        <div className="reader-nav__actions">
          <button
            type="button"
            className="reader-nav__btn"
            disabled={!prev}
            onClick={() => prev && navigate(`/book/${bookId}/read/${prev.id}`)}
          >
            上一回
          </button>
          <button
            type="button"
            className="reader-nav__btn"
            disabled={!next}
            onClick={() => next && navigate(`/book/${bookId}/read/${next.id}`)}
          >
            下一回
          </button>
        </div>
      </nav>

      <div className={`reader-body ${hasVernacular ? 'reader-body--vernacular' : ''}`}>
        <article className="reader-panel reader-panel--original">
          <span className="reader-panel__label">原文</span>
          <div className="reader-panel__scroll">
            <ReaderBlocks
              blocks={originalBlocks}
              variant="original"
              footnotes={footnotes}
              activeFn={activeFn}
              onFnClick={handleFnClick}
            />
          </div>
          <FootnoteBar activeFn={activeFn} footnotes={footnotes} onClose={() => setActiveFn(null)} />
        </article>

        {hasVernacular ? (
          <article className="reader-panel reader-panel--vernacular">
            <span className="reader-panel__label">白话 · 读书记</span>
            <ReaderBlocks blocks={vernacularBlocks!} variant="vernacular" />
          </article>
        ) : (
          <article className="reader-panel reader-panel--vernacular">
            <span className="reader-panel__label">白话 · 读书记</span>
            <div className="reader-empty">
              <span className="reader-empty__icon">📜</span>
              <p>本章白话翻译待完成</p>
              <p style={{ fontSize: '0.85rem' }}>可先读左侧原文</p>
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
