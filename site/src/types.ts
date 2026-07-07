export interface Book {
  id: string
  title: string
  subtitle: string
  author: string
  dynasty: string
  path: string
  chapters: number
  hasVernacular: boolean
  vernacularProgress: number
  spineColor: string
  accentColor: string
  description: string
}

export interface BookMeta extends Book {
  vernacularCount: number
  chapterCount: number
}

export interface Chapter {
  id: string
  filename: string
  title: string
  hasVernacular: boolean
}

export type BookAnimationPhase = 'idle' | 'pulling' | 'opening' | 'open' | 'closing' | 'returning'
