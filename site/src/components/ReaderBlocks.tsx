import { useCallback, useState } from 'react'
import type { ContentBlock, FootnoteMap } from './ReaderContent'
import { FN_KEY_RE } from './ReaderContent'

interface Props {
  blocks: ContentBlock[]
  variant: 'original' | 'vernacular'
  footnotes?: FootnoteMap
}

export function ReaderBlocks({ blocks, variant, footnotes = {} }: Props) {
  const [activeFn, setActiveFn] = useState<string | null>(null)

  const handleFnClick = useCallback((key: string) => {
    if (!footnotes[key]) return
    setActiveFn((prev) => (prev === key ? null : key))
  }, [footnotes])

  const closeFn = useCallback(() => setActiveFn(null), [])

  return (
    <>
      {blocks.map((block, i) => (
        <ReaderBlock
          key={i}
          block={block}
          variant={variant}
          index={i}
          footnotes={footnotes}
          activeFn={activeFn}
          onFnClick={handleFnClick}
        />
      ))}

      {variant === 'original' && activeFn && footnotes[activeFn] && (
        <div className="reader-fn-bar" role="dialog" aria-label="脂批注释">
          <div className="reader-fn-bar__header">
            <span className="reader-fn-bar__id">{activeFn}</span>
            <span className="reader-fn-bar__label">脂批注释</span>
            <button type="button" className="reader-fn-bar__close" onClick={closeFn} aria-label="关闭">
              ×
            </button>
          </div>
          <p className="reader-fn-bar__text">{footnotes[activeFn]}</p>
        </div>
      )}
    </>
  )
}

function ReaderBlock({
  block,
  variant,
  index,
  footnotes,
  activeFn,
  onFnClick,
}: {
  block: ContentBlock
  variant: 'original' | 'vernacular'
  index: number
  footnotes: FootnoteMap
  activeFn: string | null
  onFnClick: (key: string) => void
}) {
  const keyPrefix = `${variant}-${index}`
  const withFn = variant === 'original' && Object.keys(footnotes).length > 0

  const renderLine = (line: string, j: number) =>
    withFn ? (
      <InlineWithFootnotes
        text={line}
        keyPrefix={`${keyPrefix}-${j}`}
        footnotes={footnotes}
        activeFn={activeFn}
        onFnClick={onFnClick}
      />
    ) : (
      <span key={`${keyPrefix}-${j}-plain`}>{line}</span>
    )

  switch (block.type) {
    case 'heading':
      return (
        <div
          className={`reader-block reader-block--heading ${block.level === 2 ? 'reader-block--subheading' : ''}`}
        >
          {block.content}
        </div>
      )
    case 'section':
      return <div className="reader-block reader-block--section">{block.content}</div>
    case 'poem':
      return (
        <div className="reader-block reader-block--poem">
          {block.content.split('\n').map((line, j) => (
            <p key={j}>{renderLine(line, j)}</p>
          ))}
        </div>
      )
    case 'zhipi':
      return (
        <div className="reader-block reader-block--zhipi">
          {withFn ? (
            <InlineWithFootnotes
              text={block.content}
              keyPrefix={`${keyPrefix}-zp`}
              footnotes={footnotes}
              activeFn={activeFn}
              onFnClick={onFnClick}
            />
          ) : (
            block.content
          )}
        </div>
      )
    case 'note':
      return <div className="reader-block reader-block--note">{block.content}</div>
    case 'yiyi':
      return (
        <div className="reader-block reader-block--yiyi">
          <span className="reader-block--yiyi__label">白话意译</span>
          {block.content}
        </div>
      )
    case 'text':
      return (
        <div className="reader-block reader-block--text">
          {block.content.split('\n').map((line, j) => (
            <p key={j}>{renderLine(line, j)}</p>
          ))}
        </div>
      )
    default:
      return null
  }
}

function InlineWithFootnotes({
  text,
  keyPrefix,
  footnotes,
  activeFn,
  onFnClick,
}: {
  text: string
  keyPrefix: string
  footnotes: FootnoteMap
  activeFn: string | null
  onFnClick: (key: string) => void
}) {
  const parts = text.split(/(\[[一二三四五六七八九十百千\d]+\])/g)
  return (
    <>
      {parts.map((part, i) => {
        if (!FN_KEY_RE.test(part)) {
          return <span key={`${keyPrefix}-t-${i}`}>{part}</span>
        }
        const hasNote = !!footnotes[part]
        return (
          <sup key={`${keyPrefix}-fn-${i}`}>
            <button
              type="button"
              className={`reader-fn ${hasNote ? 'reader-fn--clickable' : 'reader-fn--empty'} ${activeFn === part ? 'reader-fn--active' : ''}`}
              onClick={() => onFnClick(part)}
              disabled={!hasNote}
              title={hasNote ? '点击查看脂批注释' : '暂无注释'}
              aria-label={hasNote ? `查看注释 ${part}` : part}
            >
              {part}
            </button>
          </sup>
        )
      })}
    </>
  )
}
