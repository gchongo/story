import { useCallback, useEffect, useState } from 'react'

export type LayoutMode = 'split' | 'original' | 'vernacular'
export type MobileTab = 'original' | 'vernacular'

const STORAGE_KEY = 'reader-preferences-v2'

interface ReaderPreferences {
  layoutMode: LayoutMode
  syncScroll: boolean
}

function normalizeLayoutMode(value: unknown): LayoutMode {
  if (value === 'original' || value === 'vernacular' || value === 'split') return value
  if (value === 'single') return 'vernacular'
  return 'split'
}

function loadPreferences(): ReaderPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('reader-preferences-v1')
    if (!raw) return { layoutMode: 'split', syncScroll: true }
    const parsed = JSON.parse(raw) as Partial<ReaderPreferences>
    return {
      layoutMode: normalizeLayoutMode(parsed.layoutMode),
      syncScroll: parsed.syncScroll !== false,
    }
  } catch {
    return { layoutMode: 'split', syncScroll: true }
  }
}

export function useReaderPreferences() {
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(() => loadPreferences().layoutMode)
  const [syncScroll, setSyncScrollState] = useState(() => loadPreferences().syncScroll)
  const [mobileTab, setMobileTab] = useState<MobileTab>('vernacular')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ layoutMode, syncScroll }))
  }, [layoutMode, syncScroll])

  const setLayoutMode = useCallback((mode: LayoutMode) => setLayoutModeState(mode), [])
  const setSyncScroll = useCallback((on: boolean) => setSyncScrollState(on), [])

  return { layoutMode, setLayoutMode, syncScroll, setSyncScroll, mobileTab, setMobileTab }
}
