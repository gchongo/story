export type ContentBlock =
  | { type: 'heading'; content: string; level: 1 | 2 }
  | { type: 'section'; content: string }
  | { type: 'text'; content: string }
  | { type: 'poem'; content: string }
  | { type: 'zhipi'; content: string }
  | { type: 'note'; content: string }
  | { type: 'yiyi'; content: string }

function isMetadataLine(line: string): boolean {
  const t = line.trim()
  return (
    /^=+$/.test(t) ||
    t.startsWith('【本回对应原文】') ||
    t.startsWith('【体例】') ||
    /^《.+》（白话全译）$/.test(t) ||
    t === '---'
  )
}

function stripMarkdownBold(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1')
}

export function parseReaderContent(text: string): ContentBlock[] {
  const lines = text.split('\n')
  const blocks: ContentBlock[] = []
  let skipSection = false
  let pastHeader = false
  let pendingYiyi: string | null = null

  const flushYiyi = (extra?: string) => {
    if (pendingYiyi !== null) {
      blocks.push({ type: 'yiyi', content: pendingYiyi + (extra ? extra : '') })
      pendingYiyi = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      flushYiyi()
      if (blocks.length && blocks[blocks.length - 1].type === 'text') {
        blocks[blocks.length - 1].content += '\n'
      }
      continue
    }

    if (!pastHeader) {
      if (isMetadataLine(trimmed)) continue
      if (trimmed.startsWith('# ')) pastHeader = true
    }

    if (trimmed.startsWith('## ')) {
      flushYiyi()
      const title = trimmed.slice(3).trim()
      if (title.includes('回前墨·原文')) {
        skipSection = true
        continue
      }
      skipSection = false
      blocks.push({ type: 'heading', content: title, level: 2 })
      continue
    }

    if (skipSection) continue

    if (trimmed.startsWith('# ')) {
      flushYiyi()
      blocks.push({ type: 'heading', content: trimmed.slice(2).trim(), level: 1 })
      continue
    }

    if (trimmed.startsWith('> 【读书记】')) {
      flushYiyi()
      blocks.push({ type: 'note', content: trimmed.slice(8).trim() })
      continue
    }

    if (trimmed.startsWith('> 【脂批') || trimmed.startsWith('> 【批')) {
      flushYiyi()
      blocks.push({ type: 'zhipi', content: trimmed.replace(/^>\s*/, '') })
      continue
    }

    if (trimmed.startsWith('>')) {
      flushYiyi()
      blocks.push({ type: 'zhipi', content: trimmed.slice(1).trim() })
      continue
    }

    if (trimmed.startsWith('**【白话意译】**')) {
      flushYiyi()
      const rest = trimmed.replace('**【白话意译】**', '').trim()
      pendingYiyi = rest
      continue
    }

    if (pendingYiyi !== null && !trimmed.startsWith('>') && !trimmed.startsWith('#')) {
      pendingYiyi += (pendingYiyi.endsWith('\n') || !pendingYiyi ? '' : '\n') + stripMarkdownBold(trimmed)
      continue
    }

    flushYiyi()

    if (/^[\u3000 ]{1,}/.test(line) && trimmed.length < 100 && /[，。；：！？]/.test(trimmed)) {
      blocks.push({ type: 'poem', content: trimmed })
      continue
    }

    const last = blocks[blocks.length - 1]
    const plain = stripMarkdownBold(trimmed)
    if (last?.type === 'text') {
      last.content += (last.content.endsWith('\n') ? '' : '\n') + plain
    } else {
      blocks.push({ type: 'text', content: plain })
    }
  }

  flushYiyi()
  return blocks
}

export function parseOriginalContent(text: string): ContentBlock[] {
  const lines = text.split('\n')
  const blocks: ContentBlock[] = []
  let titleShown = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('===')) continue

    if (/^《.+》$/.test(trimmed)) continue

    if (trimmed.startsWith('# ')) {
      if (titleShown) continue
      titleShown = true
      blocks.push({ type: 'heading', content: trimmed.slice(2).replace(/\s+/g, ' ').trim(), level: 1 })
      continue
    }

    if (trimmed === '【回前墨】' || trimmed.startsWith('【回前墨】')) {
      if (trimmed === '【回前墨】') {
        blocks.push({ type: 'section', content: '回前墨' })
      }
      continue
    }

    if (trimmed.startsWith('>')) {
      blocks.push({ type: 'zhipi', content: trimmed.slice(1).trim() })
      continue
    }

    if (trimmed === '诗曰：' || trimmed === '诗曰') {
      blocks.push({ type: 'section', content: '诗曰' })
      continue
    }

    if (/^[\u3000 ]{1,}/.test(line) && trimmed.length < 90 && /[，。；：！？]/.test(trimmed)) {
      blocks.push({ type: 'poem', content: trimmed })
      continue
    }

    const last = blocks[blocks.length - 1]
    if (last?.type === 'text') {
      last.content += '\n' + line
    } else {
      blocks.push({ type: 'text', content: line })
    }
  }

  return blocks
}

/** 行内批注角标 [一] [1] 等 */
export function renderInlineText(text: string, keyPrefix: string) {
  const parts = text.split(/(\[[一二三四五六七八九十百千\d]+\])/g)
  return parts.map((part, i) => {
    if (/^\[[一二三四五六七八九十百千\d]+\]$/.test(part)) {
      return (
        <sup key={`${keyPrefix}-fn-${i}`} className="reader-fn" title="批注">
          {part}
        </sup>
      )
    }
    return <span key={`${keyPrefix}-t-${i}`}>{part}</span>
  })
}
