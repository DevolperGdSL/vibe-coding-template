const TITLES = [
  'Aprendiz',
  'Iniciante',
  'Praticante',
  'Constante',
  'Dedicado',
  'Veterano',
  'Guardião',
  'Mestre',
  'Lenda'
]

export const MAX_LEVEL = 100

export function xpToAdvance(level) {
  return 25 + (level - 1) * 15
}

export function progressFromXp(xp) {
  const total = Math.max(0, Math.floor(Number(xp) || 0))
  let level = 1
  let rest = total
  let need = xpToAdvance(level)
  while (rest >= need && level < MAX_LEVEL) {
    rest -= need
    level += 1
    if (level >= MAX_LEVEL) break
    need = xpToAdvance(level)
  }
  return {
    xp: total,
    level,
    xpIntoLevel: level >= MAX_LEVEL ? 0 : rest,
    xpForNext: level >= MAX_LEVEL ? 0 : need
  }
}

export function pointsForLevel(level) {
  return Math.max(0, Math.min(level, MAX_LEVEL) - 1)
}

export function titleForLevel(level) {
  const index = Math.min(Math.max(level, 1), TITLES.length) - 1
  return TITLES[index]
}
