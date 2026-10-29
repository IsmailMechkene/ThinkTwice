import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { dayKey } from '../lib/date'
import { applyAnswer } from '../lib/mistakes'
import { reviewCard } from '../lib/srs'
import { downloadJson, emptyProgress, load, normalizeProgress, remove, save } from '../lib/storage'

export const ProgressContext = createContext(null)

const DEFAULT_PROFILES = { list: [{ id: 'me', name: 'Me' }], current: 'me' }

function loadProfiles() {
  const p = load('profiles', null)
  if (!p?.list?.length) return DEFAULT_PROFILES
  if (!p.list.some((x) => x.id === p.current)) return { ...p, current: p.list[0].id }
  return p
}

function loadProgress(profileId) {
  return normalizeProgress(load(`progress:${profileId}`, null))
}

function slug(name) {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'profile'
  )
}

function bumpDaily(progress, patch) {
  const today = dayKey()
  const day = progress.daily[today] || { answered: 0, correct: 0, cards: 0, mistakes: 0 }
  const next = { ...day }
  for (const [k, v] of Object.entries(patch)) next[k] = (next[k] || 0) + v
  next.mistakes = Object.keys(progress.mistakes).length
  return { ...progress.daily, [today]: next }
}

export function ProgressProvider({ children }) {
  const [profiles, setProfiles] = useState(loadProfiles)
  const [progress, setProgressState] = useState(() => loadProgress(profiles.current))
  const progressRef = useRef(progress)

  const setProgress = useCallback((next) => {
    progressRef.current = next
    setProgressState(next)
  }, [])

  useEffect(() => save('profiles', profiles), [profiles])
  useEffect(() => save(`progress:${profiles.current}`, progress), [profiles.current, progress])

  // Records one answered question. Returns the mistake-bank event
  // ('added' | 'reset' | 'progress' | 'mastered' | 'same-day' | null) so the UI can react.
  const answerQuestion = useCallback(
    (question, chosen, correct) => {
      const p = progressRef.current
      const today = dayKey()
      const prev = p.questions[question.id] || { attempts: 0, correct: 0 }
      const { bank, event } = applyAnswer(p.mistakes, question.id, { correct, chosen }, today)
      const next = {
        ...p,
        questions: {
          ...p.questions,
          [question.id]: {
            attempts: prev.attempts + 1,
            correct: prev.correct + (correct ? 1 : 0),
            lastAt: today,
            lastCorrect: correct,
          },
        },
        mistakes: bank,
        mastered: event === 'mastered' ? { ...p.mastered, [question.id]: today } : p.mastered,
      }
      next.daily = bumpDaily(next, { answered: 1, correct: correct ? 1 : 0 })
      setProgress(next)
      return event
    },
    [setProgress],
  )

  const reviewFlashcard = useCallback(
    (id, knew) => {
      const p = progressRef.current
      const next = { ...p, flashcards: { ...p.flashcards, [id]: reviewCard(p.flashcards[id], knew) } }
      next.daily = bumpDaily(next, { cards: 1 })
      setProgress(next)
    },
    [setProgress],
  )

  const recordSession = useCallback(
    (session) => {
      const p = progressRef.current
      setProgress({ ...p, sessions: [...p.sessions, { ...session, day: dayKey(), at: Date.now() }].slice(-500) })
    },
    [setProgress],
  )

  const resetProgress = useCallback(() => setProgress(emptyProgress()), [setProgress])

  const currentProfile = profiles.list.find((x) => x.id === profiles.current)

  const exportProgress = useCallback(() => {
    downloadJson(`thinktwice-${currentProfile.id}-${dayKey()}.json`, {
      app: 'thinktwice',
      profile: currentProfile.name,
      exportedAt: new Date().toISOString(),
      progress: progressRef.current,
    })
  }, [currentProfile])

  // Throws on files that are not ThinkTwice exports.
  const importProgress = useCallback(
    (data) => {
      if (data?.app !== 'thinktwice' || typeof data.progress !== 'object') {
        throw new Error('This file is not a ThinkTwice progress export.')
      }
      setProgress(normalizeProgress(data.progress))
    },
    [setProgress],
  )

  const switchProfile = useCallback(
    (id) => {
      setProfiles((ps) => ({ ...ps, current: id }))
      setProgress(loadProgress(id))
    },
    [setProgress],
  )

  const addProfile = useCallback(
    (name) => {
      const clean = name.trim()
      if (!clean) return
      let id = slug(clean)
      const taken = new Set(profiles.list.map((x) => x.id))
      for (let i = 2; taken.has(id); i++) id = `${slug(clean)}-${i}`
      setProfiles((ps) => ({ list: [...ps.list, { id, name: clean }], current: id }))
      setProgress(loadProgress(id))
    },
    [profiles.list, setProgress],
  )

  const deleteProfile = useCallback(
    (id) => {
      if (profiles.list.length <= 1) return
      remove(`progress:${id}`)
      const list = profiles.list.filter((x) => x.id !== id)
      const current = profiles.current === id ? list[0].id : profiles.current
      setProfiles({ list, current })
      if (profiles.current === id) setProgress(loadProgress(current))
    },
    [profiles, setProgress],
  )

  const value = useMemo(
    () => ({
      progress,
      profiles: profiles.list,
      currentProfile,
      answerQuestion,
      reviewFlashcard,
      recordSession,
      resetProgress,
      exportProgress,
      importProgress,
      switchProfile,
      addProfile,
      deleteProfile,
    }),
    [
      progress,
      profiles.list,
      currentProfile,
      answerQuestion,
      reviewFlashcard,
      recordSession,
      resetProgress,
      exportProgress,
      importProgress,
      switchProfile,
      addProfile,
      deleteProfile,
    ],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
