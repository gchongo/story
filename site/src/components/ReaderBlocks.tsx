import type { MouseEvent, ReactNode } from 'react'
import type { ContentBlock, FootnoteMap } from './ReaderContent'
import { FN_KEY_RE } from './ReaderContent'

interface Props {
  blocks: ContentBlock[]
  variant: 'original' | 'vernacular'
  footnotes?: FootnoteMap
  activeFn?: string | null
  onFnClick?: (key: string, el: HTMLElement) => void
}

export function ReaderBlocks({ blocks, variant, footnotes = {}, activeFn = null, onFnClick }: Props) {
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
          onFnClick={onFnClick}
        />
      ))}
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
  onFnClick?: (key: string, el: HTMLElement) => void
}) {
  const keyPrefix = `${variant}-${index}`
  const withFn = variant === 'original' && onFnClick && Object.keys(footnotes).length > 0

  const wrap = (node: ReactNode) => (
    <div className="reader-anchor" data-reader-anchor={index}>
      {node}
    </div>
  )

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
      return wrap(
        <div
          className={`reader-block reader-block--heading ${block.level === 2 ? 'reader-block--subheading' : ''}`}
        >
          {block.content}
        </div>,
      )
    case 'section':
      return wrap(<div className="reader-block reader-block--section">{block.content}</div>)
    case 'poem':
      return wrap(
        <div className="reader-block reader-block--poem">
          {block.content.split('\n').map((line, j) => (
            <p key={j}>{renderLine(line, j)}</p>
          ))}
        </div>,
      )
    case 'zhipi':
      return wrap(
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
        </div>,
      )
    case 'note':
      return wrap(<div className="reader-block reader-block--note">{block.content}</div>)
    case 'yiyi':
      return wrap(
        <div className="reader-block reader-block--yiyi">
          <span className="reader-block--yiyi__label">白话意译</span>
          {block.content}
        </div>,
      )
    case 'text':
      return wrap(
        <div className="reader-block reader-block--text">
          {block.content.split('\n').map((line, j) => (
            <p key={j}>{renderLine(line, j)}</p>
          ))}
        </div>,
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
  onFnClick: (key: string, el: HTMLElement) => void
}) {
  const parts = text.split(/(\[[一二三四五六七八九十百千\d]+\])/g)

  const handleClick = (e: MouseEvent<HTMLSpanElement>, key: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (footnotes[key]) onFnClick(key, e.currentTarget)
  }

  return (
    <>
      {parts.map((part, i) => {
        if (!FN_KEY_RE.test(part)) {
          return <span key={`${keyPrefix}-t-${i}`}>{part}</span>
        }
        const hasNote = !!footnotes[part]
        return (
          <span
            key={`${keyPrefix}-fn-${i}`}
            role={hasNote ? 'button' : undefined}
            tabIndex={hasNote ? 0 : undefined}
            className={`reader-fn ${hasNote ? 'reader-fn--clickable' : 'reader-fn--empty'} ${activeFn === part ? 'reader-fn--active' : ''}`}
            onClick={hasNote ? (e) => handleClick(e, part) : undefined}
            onKeyDown={
              hasNote
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onFnClick(part, e.currentTarget)
                    }
                  }
                : undefined
            }
            title={hasNote ? '点击查看脂批注释' : '暂无注释'}
          >
            {part}
          </span>
        )
      })}
    </>
  )
}
