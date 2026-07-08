import { useEffect, useRef, type RefObject } from 'react'

function syncPanels(source: HTMLElement, target: HTMLElement) {
  const maxSrc = source.scrollHeight - source.clientHeight
  const maxTgt = target.scrollHeight - target.clientHeight
  if (maxSrc <= 0 || maxTgt <= 0) return

  const ratio = source.scrollTop / maxSrc
  const nextTop = ratio * maxTgt
  if (Math.abs(target.scrollTop - nextTop) < 2) return
  target.scrollTop = nextTop
}

export function useSyncScroll(
  leftRef: RefObject<HTMLElement | null>,
  rightRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  /** 内容就绪后变化，触发重新绑定（如章节切换、加载完成） */
  rebindKey: string | number | boolean,
) {
  const syncing = useRef<'left' | 'right' | null>(null)

  useEffect(() => {
    if (!enabled) return

    let cleanup: (() => void) | undefined

    const tryAttach = () => {
      const left = leftRef.current
      const right = rightRef.current
      if (!left || !right) return

      cleanup?.()

      const run = (from: 'left' | 'right') => {
        if (syncing.current && syncing.current !== from) return
        syncing.current = from
        const source = from === 'left' ? left : right
        const target = from === 'left' ? right : left
        syncPanels(source, target)
        requestAnimationFrame(() => {
          syncing.current = null
        })
      }

      const onLeft = () => run('left')
      const onRight = () => run('right')

      left.addEventListener('scroll', onLeft, { passive: true })
      right.addEventListener('scroll', onRight, { passive: true })
      cleanup = () => {
        left.removeEventListener('scroll', onLeft)
        right.removeEventListener('scroll', onRight)
      }
    }

    tryAttach()
    const timer = window.setTimeout(tryAttach, 50)

    return () => {
      window.clearTimeout(timer)
      cleanup?.()
    }
  }, [enabled, rebindKey, leftRef, rightRef])
}
