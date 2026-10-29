// All persistence goes through here. Every access is guarded: storage can be
// unavailable (private mode, blocked site data) and the app must still work.
const PREFIX = 'thinktwice:'

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage full or unavailable */
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

// False in browsers that block storage (some private modes, blocked site data).
export function storageAvailable() {
  try {
    const k = PREFIX + '__test'
    localStorage.setItem(k, '1')
    localStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

// Asks the browser not to evict our data when disk space runs low (best effort).
export function requestPersistentStorage() {
  try {
    navigator.storage?.persist?.().catch(() => {})
  } catch {
    /* unsupported */
  }
}

export const PROGRESS_VERSION = 1

export function emptyProgress() {
  return {
    version: PROGRESS_VERSION,
    questions: {}, // id -> { attempts, correct, lastAt, lastCorrect }
    flashcards: {}, // id -> Leitner state
    mistakes: {}, // id -> mistake bank entry
    mastered: {}, // id -> day it left the mistake bank
    sessions: [], // finished quizzes
    daily: {}, // day -> { answered, correct, cards, mistakes }
  }
}

export function normalizeProgress(data) {
  const base = emptyProgress()
  if (!data || typeof data !== 'object') return base
  return { ...base, ...data, version: PROGRESS_VERSION }
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
