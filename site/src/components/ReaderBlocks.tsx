import type { ContentBlock } from '../components/ReaderContent'
import { renderInlineText } from '../components/ReaderContent'

interface Props {
  blocks: ContentBlock[]
  variant: 'original' | 'vernacular'
}

export function ReaderBlocks({ blocks, variant }: Props) {
  return (
    <>
      {blocks.map((block, i) => (
        <ReaderBlock key={i} block={block} variant={variant} index={i} />
      ))}
    </>
  )
}

function ReaderBlock({
  block,
  variant,
  index,
}: {
  block: ContentBlock
  variant: 'original' | 'vernacular'
  index: number
}) {
  const keyPrefix = `${variant}-${index}`

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
            <p key={j}>{line}</p>
          ))}
        </div>
      )
    case 'zhipi':
      return <div className="reader-block reader-block--zhipi">{block.content}</div>
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
            <p key={j}>{renderInlineText(line, `${keyPrefix}-${j}`)}</p>
          ))}
        </div>
      )
    default:
      return null
  }
}
