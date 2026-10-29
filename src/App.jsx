import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import { useI18n } from './i18n/I18nContext'
import Flashcards from './pages/Flashcards'
import Home from './pages/Home'
import Mistakes from './pages/Mistakes'
import NotFound from './pages/NotFound'
import QuizPlayer from './pages/QuizPlayer'
import QuizSetup from './pages/QuizSetup'
import Results from './pages/Results'
import Subject from './pages/Subject'

// Stats pulls in Recharts; load it only when the page is opened.
const Stats = lazy(() => import('./pages/Stats'))

function Loading() {
  const { t } = useI18n()
  return <p className="text-slate-500">{t('common.loading')}</p>
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="subject/:subjectId" element={<Subject />} />
        <Route path="quiz" element={<QuizSetup />} />
        <Route path="quiz/play" element={<QuizPlayer />} />
        <Route path="results" element={<Results />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="mistakes" element={<Mistakes />} />
        <Route
          path="stats"
          element={
            <Suspense fallback={<Loading />}>
              <Stats />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
