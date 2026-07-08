import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchBookMeta,
  fetchChapters,
  fetchChapterText,
  parseOriginalChapter,
  parseReaderContent,
} from '../api'
import { ReaderBlocks } from '../components/ReaderBlocks'
import {
  FootnotePopover,
  calcPopoverPosition,
  type FootnotePopoverState,
} from '../components/FootnotePopover'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useReaderPreferences } from '../hooks/useReaderPreferences'
import { useSyncScroll } from '../hooks/useSyncScroll'
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
  const [fnPopover, setFnPopover] = useState<FootnotePopoverState | null>(null)

  const isNarrow = useMediaQuery('(max-width: 900px)')
  const { layoutMode, setLayoutMode, syncScroll, setSyncScroll, mobileTab, setMobileTab } =
    useReaderPreferences()

  const originalScrollRef = useRef<HTMLDivElement>(null)
  const vernacularScrollRef = useRef<HTMLDivElement>(null)

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
    setFnPopover(null)
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

  const handleFnClick = useCallback(
    (key: string, el: HTMLElement) => {
      if (fnPopover?.key === key) {
        setActiveFn(null)
        setFnPopover(null)
        return
      }
      setActiveFn(key)
      setFnPopover({ key, ...calcPopoverPosition(el) })
    },
    [fnPopover?.key],
  )

  const closeFnPopover = useCallback(() => {
    setActiveFn(null)
    setFnPopover(null)
  }, [])

  const { blocks: originalBlocks, footnotes } = parseOriginalChapter(original)
  const vernacularBlocks = vernacular ? parseReaderContent(vernacular) : null
  const hasVernacular = !!vernacularBlocks?.length

  const showSplit = hasVernacular && !isNarrow && layoutMode === 'split'
  const showSingleOriginal = !isNarrow && layoutMode === 'original'
  const showSingleVernacular = hasVernacular && !isNarrow && layoutMode === 'vernacular'
  const showTabs = hasVernacular && isNarrow

  const showDualBody = showSplit || (!hasVernacular && layoutMode === 'split' && !isNarrow)

  useSyncScroll(
    originalScrollRef,
    vernacularScrollRef,
    showSplit && syncScroll,
    `${chapterId}-${loading}-${original.length}-${vernacular?.length ?? 0}`,
  )

  const showOriginalPanel =
    showSplit || showSingleOriginal || showTabs || (!hasVernacular && layoutMode !== 'vernacular')
  const showVernacularPanel =
    !showSingleOriginal && (showSplit || showSingleVernacular || showTabs || !hasVernacular)

  if (loading || !meta) {
    return <div className="reader-loading">正在展开书页…</div>
  }

  const originalPanel = (
    <article
      className={`reader-panel reader-panel--original ${
        showTabs && mobileTab !== 'original' ? 'reader-panel--hidden' : ''
      } ${showSingleOriginal ? 'reader-panel--solo' : ''}`}
    >
      <span className="reader-panel__label">原文</span>
      <div className="reader-panel__scroll" ref={originalScrollRef}>
        <ReaderBlocks
          blocks={originalBlocks}
          variant="original"
          footnotes={footnotes}
          activeFn={activeFn}
          onFnClick={handleFnClick}
        />
      </div>
      <FootnotePopover popover={fnPopover} footnotes={footnotes} onClose={closeFnPopover} />
    </article>
  )

  const vernacularPanel = hasVernacular ? (
    <article
      className={`reader-panel reader-panel--vernacular ${
        showTabs && mobileTab !== 'vernacular' ? 'reader-panel--hidden' : ''
      } ${showSingleVernacular ? 'reader-panel--solo' : ''}`}
    >
      <span className="reader-panel__label">白话 · 读书记</span>
      <div className="reader-panel__scroll" ref={vernacularScrollRef}>
        <ReaderBlocks blocks={vernacularBlocks!} variant="vernacular" />
      </div>
    </article>
  ) : (
    <article className="reader-panel reader-panel--vernacular">
      <span className="reader-panel__label">白话 · 读书记</span>
      <div className="reader-panel__scroll">
        <div className="reader-empty">
          <span className="reader-empty__icon">📜</span>
          <p>本章白话翻译待完成</p>
          <p className="reader-empty__hint">可先读左侧原文</p>
        </div>
      </div>
    </article>
  )

  return (
    <div
      className={[
        'reader-page',
        !hasVernacular ? 'reader-page--original-only' : '',
        showSplit ? 'reader-page--split' : '',
        showSingleOriginal ? 'reader-page--single-original' : '',
        showSingleVernacular ? 'reader-page--single-vernacular' : '',
        showTabs ? 'reader-page--tabs' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <nav className="reader-nav">
        <Link className="reader-nav__back" to={`/book/${bookId}`}>
          目录
        </Link>
        <h2 className="reader-nav__title">{chapter?.title ?? `第 ${chapterId} 章`}</h2>

        {!isNarrow && (
          <div className="reader-nav__tools">
            <div className="reader-nav__mode" role="group" aria-label="阅读模式">
              {hasVernacular && (
                <button
                  type="button"
                  className={`reader-nav__mode-btn ${layoutMode === 'split' ? 'reader-nav__mode-btn--active' : ''}`}
                  onClick={() => setLayoutMode('split')}
                >
                  双栏
                </button>
              )}
              <button
                type="button"
                className={`reader-nav__mode-btn ${layoutMode === 'original' ? 'reader-nav__mode-btn--active' : ''}`}
                onClick={() => setLayoutMode('original')}
              >
                原文
              </button>
              {hasVernacular && (
                <button
                  type="button"
                  className={`reader-nav__mode-btn ${layoutMode === 'vernacular' ? 'reader-nav__mode-btn--active' : ''}`}
                  onClick={() => setLayoutMode('vernacular')}
                >
                  白话
                </button>
              )}
            </div>
            {showSplit && (
              <button
                type="button"
                className={`reader-nav__sync ${syncScroll ? 'reader-nav__sync--on' : ''}`}
                onClick={() => setSyncScroll(!syncScroll)}
                title="两侧滚动时按阅读进度对齐"
              >
                同步滚动
              </button>
            )}
          </div>
        )}

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

      {showTabs && (
        <div className="reader-tabs" role="tablist" aria-label="阅读内容">
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'vernacular'}
            className={`reader-tabs__btn ${mobileTab === 'vernacular' ? 'reader-tabs__btn--active' : ''}`}
            onClick={() => setMobileTab('vernacular')}
          >
            白话
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'original'}
            className={`reader-tabs__btn ${mobileTab === 'original' ? 'reader-tabs__btn--active' : ''}`}
            onClick={() => setMobileTab('original')}
          >
            原文
          </button>
        </div>
      )}

      <div
        className={[
          'reader-body',
          showDualBody ? 'reader-body--dual' : 'reader-body--single',
          showSingleOriginal ? 'reader-body--single-original' : '',
          showSingleVernacular ? 'reader-body--single-vernacular' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {showOriginalPanel && originalPanel}
        {showVernacularPanel && vernacularPanel}
      </div>
    </div>
  )
}
