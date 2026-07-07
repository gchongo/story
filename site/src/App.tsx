import { Routes, Route } from 'react-router-dom'
import { BookshelfPage } from './pages/BookshelfPage'
import { BookPage } from './pages/BookPage'
import { ReaderPage } from './pages/ReaderPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BookshelfPage />} />
      <Route path="/book/:bookId" element={<BookPage />} />
      <Route path="/book/:bookId/read/:chapterId" element={<ReaderPage />} />
    </Routes>
  )
}
