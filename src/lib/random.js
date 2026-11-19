// `rand` defaults to Math.random; pass seededRandom(seed) for a reproducible order.
export function shuffle(array, rand = Math.random) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Short random seed for links, e.g. "k3f9a".
export function newSeed() {
  return Math.floor(Math.random() * 36 ** 5)
    .toString(36)
    .padStart(5, '0')
}

// Deterministic generator (mulberry32) from any string: the same seed gives the same sequence everywhere.
export function seededRandom(seed) {
  let h = 1779033703
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 3432918353)
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
