import { useCallback, useEffect, useState } from 'react'

export type LayoutMode = 'split' | 'single'
export type MobileTab = 'original' | 'vernacular'

const STORAGE_KEY = 'reader-preferences-v1'

interface ReaderPreferences {
  layoutMode: LayoutMode
  syncScroll: boolean
}

function loadPreferences(): ReaderPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { layoutMode: 'split', syncScroll: true }
    const parsed = JSON.parse(raw) as Partial<ReaderPreferences>
    return {
      layoutMode: parsed.layoutMode === 'single' ? 'single' : 'split',
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
