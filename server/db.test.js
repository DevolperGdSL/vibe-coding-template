import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { todayISO } from '../src/lib/dates.js'
import { progressFromXp, MAX_LEVEL } from '../src/lib/progress.js'
import { occursOn } from '../src/lib/schedule.js'
import { pixelsForHero } from '../src/lib/sprites.js'
import { CLASSES, RACES } from '../src/lib/heroes.js'
import { createStore } from './db.js'

describe('progress', () => {
  it('sobe de nível e para em 100', () => {
    expect(progressFromXp(0)).toMatchObject({ level: 1, xpIntoLevel: 0, xpForNext: 25 })
    expect(progressFromXp(25)).toMatchObject({ level: 2, xpIntoLevel: 0 })
    expect(progressFromXp(24).level).toBe(1)
    expect(progressFromXp(9_999_999).level).toBe(MAX_LEVEL)
  })
})

describe('agenda', () => {
  it('respeita uma vez, semana e mês', () => {
    const once = { repeat: 'once', anchorDate: '2026-09-21', weekdays: [], monthDay: null }
    expect(occursOn(once, '2026-09-21')).toBe(true)
    expect(occursOn(once, '2026-09-22')).toBe(false)
    const weekly = { repeat: 'weekly', anchorDate: '2026-09-01', weekdays: [1], monthDay: null }
    expect(occursOn(weekly, '2026-09-07')).toBe(true)
    expect(occursOn(weekly, '2026-09-08')).toBe(false)
    const monthly = { repeat: 'monthly', anchorDate: '2026-01-31', weekdays: [], monthDay: 31 }
    expect(occursOn(monthly, '2026-02-28')).toBe(true)
    expect(occursOn(monthly, '2026-03-31')).toBe(true)
  })
})

describe('sprites', () => {
  it('mantém a grade e diferencia classes', () => {
    const signatures = new Set()
    for (const klass of CLASSES) {
      for (const race of RACES) {
        const grid = pixelsForHero({ classId: klass.id, raceId: race.id, level: 80 })
        expect(grid).toHaveLength(40)
        for (const row of grid) expect(row).toHaveLength(32)
        signatures.add(grid.flat().join('|'))
      }
    }
    expect(signatures.size).toBeGreaterThan(8)
  })
})

describe('sqlite store', () => {
  let dir
  let store

  afterEach(() => {
    store?.close()
    if (dir) rmSync(dir, { recursive: true, force: true })
  })

  it('separa xp do herói do xp total', () => {
    dir = mkdtempSync(join(tmpdir(), 'habits-'))
    store = createStore(join(dir, 'habits.sqlite'))
    const tag = store.listTags()[0]
    const habit = store.createHabit({
      title: 'Água',
      tagId: tag.id,
      weight: 30,
      repeat: 'daily',
      anchorDate: '2026-01-01',
      weekdays: [],
      monthDay: null
    })
    expect(store.createHero({ name: 'Tank', classId: 'tank', raceId: 'orc' })).toBe('locked')
    const hero = store.createHero({ name: 'Nyx', classId: 'mago', raceId: 'elfo' })
    expect(store.toggleMark(habit.id, todayISO()).marked).toBe(true)
    expect(store.getProfile()).toMatchObject({ xp: 30, habitCount: 1 })
    expect(store.getHero(hero.id).xp).toBe(30)
    const before = store.getProfile().xp
    expect(store.spendPoint(hero.id, 'int', 1).spent.int).toBe(1)
    expect(store.getProfile().xp).toBe(before)
    store.toggleMark(habit.id, todayISO())
    expect(store.getProfile().xp).toBe(0)
    expect(store.removeHabit(habit.id)).toBe(true)
  })
})
