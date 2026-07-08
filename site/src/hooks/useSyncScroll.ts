import { useEffect, useRef, type RefObject } from 'react'

function anchorOffset(anchor: HTMLElement, container: HTMLElement): number {
  const cRect = container.getBoundingClientRect()
  const aRect = anchor.getBoundingClientRect()
  return aRect.top - cRect.top + container.scrollTop
}

function activeAnchorIndex(anchors: HTMLElement[], container: HTMLElement, lead = 72): number {
  const scrollTop = container.scrollTop
  let idx = 0
  for (let i = 0; i < anchors.length; i++) {
    if (anchorOffset(anchors[i], container) <= scrollTop + lead) idx = i
  }
  return idx
}

function syncPanels(source: HTMLElement, target: HTMLElement) {
  const srcAnchors = [...source.querySelectorAll<HTMLElement>('[data-reader-anchor]')]
  const tgtAnchors = [...target.querySelectorAll<HTMLElement>('[data-reader-anchor]')]

  if (!srcAnchors.length || !tgtAnchors.length) {
    const maxSrc = Math.max(1, source.scrollHeight - source.clientHeight)
    const ratio = source.scrollTop / maxSrc
    target.scrollTop = ratio * Math.max(0, target.scrollHeight - target.clientHeight)
    return
  }

  const srcIdx = activeAnchorIndex(srcAnchors, source)
  const tgtIdx = Math.round(
    (srcIdx / Math.max(1, srcAnchors.length - 1)) * (tgtAnchors.length - 1),
  )
  const tgtAnchor = tgtAnchors[tgtIdx]
  target.scrollTop = Math.max(0, anchorOffset(tgtAnchor, target) - 72)
}

export function useSyncScroll(
  leftRef: RefObject<HTMLElement | null>,
  rightRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const syncing = useRef(false)

  useEffect(() => {
    if (!enabled) return
    const left = leftRef.current
    const right = rightRef.current
    if (!left || !right) return

    const run = (source: HTMLElement, target: HTMLElement) => {
      if (syncing.current) return
      syncing.current = true
      syncPanels(source, target)
      requestAnimationFrame(() => {
        syncing.current = false
      })
    }

    const onLeft = () => run(left, right)
    const onRight = () => run(right, left)

    left.addEventListener('scroll', onLeft, { passive: true })
    right.addEventListener('scroll', onRight, { passive: true })
    return () => {
      left.removeEventListener('scroll', onLeft)
      right.removeEventListener('scroll', onRight)
    }
  }, [enabled, leftRef, rightRef])
}
