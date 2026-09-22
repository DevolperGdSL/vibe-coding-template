import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { streakFromDates, todayISO } from '../src/lib/dates.js'
import { CLASSES, findClass, findRace } from '../src/lib/heroes.js'
import { pointsForLevel, progressFromXp, titleForLevel } from '../src/lib/progress.js'
import { occursOn } from '../src/lib/schedule.js'

const { DatabaseSync } = process.getBuiltinModule('node:sqlite')
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const ATTRS = ['str', 'agi', 'int', 'con']

function parseWeekdays(raw) {
  try {
    const value = JSON.parse(raw || '[]')
    return Array.isArray(value) ? value.map(Number) : []
  } catch {
    return []
  }
}

export function createStore(filePath = join(root, 'data', 'habits.sqlite')) {
  if (filePath !== ':memory:') mkdirSync(dirname(filePath), { recursive: true })
  const db = new DatabaseSync(filePath)
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tag TEXT NOT NULL DEFAULT '',
      weight INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS habit_marks (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      weight INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (habit_id, date),
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS character (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS heroes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      class_id TEXT NOT NULL,
      race_id TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 0,
      attr_str INTEGER NOT NULL DEFAULT 0,
      attr_agi INTEGER NOT NULL DEFAULT 0,
      attr_int INTEGER NOT NULL DEFAULT 0,
      attr_con INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_marks_date ON habit_marks(date);
  `)

  function ensureColumn(table, definition) {
    const name = definition.split(' ')[0]
    const cols = db.prepare(`PRAGMA table_info(${table})`).all()
    if (!cols.some((col) => col.name === name)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`)
    }
  }

  ensureColumn('habits', 'tag_id TEXT')
  ensureColumn('habits', "repeat_rule TEXT NOT NULL DEFAULT 'daily'")
  ensureColumn('habits', 'anchor_date TEXT')
  ensureColumn('habits', "weekdays TEXT NOT NULL DEFAULT '[]'")
  ensureColumn('habits', 'month_day INTEGER')
  ensureColumn('habit_marks', 'hero_id TEXT')
  ensureColumn('character', 'avatar TEXT')

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE habits
     SET anchor_date = substr(created_at, 1, 10)
     WHERE anchor_date IS NULL OR anchor_date = ''`
  ).run()

  const legacy = db.prepare("SELECT id, tag FROM habits WHERE tag <> '' AND (tag_id IS NULL OR tag_id = '')").all()
  for (const row of legacy) {
    let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(row.tag)
    if (!tag) {
      tag = { id: randomUUID() }
      db.prepare('INSERT INTO tags (id, name, icon, created_at) VALUES (?, ?, ?, ?)').run(tag.id, row.tag, '🏷️', now)
    }
    db.prepare('UPDATE habits SET tag_id = ? WHERE id = ?').run(tag.id, row.id)
  }

  if (db.prepare('SELECT COUNT(*) AS count FROM tags').get().count === 0) {
    for (const [name, icon] of [['Casa', '🏠'], ['Escola', '🏫']]) {
      db.prepare('INSERT INTO tags (id, name, icon, created_at) VALUES (?, ?, ?, ?)').run(randomUUID(), name, icon, now)
    }
  }

  if (!db.prepare('SELECT id FROM character WHERE id = ?').get('player')) {
    db.prepare('INSERT INTO character (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(
      'player',
      'Aventureiro',
      now,
      now
    )
  }

  function mapTag(row) {
    return { id: row.id, name: row.name, icon: row.icon, createdAt: row.created_at }
  }

  function mapHabit(row) {
    return {
      id: row.id,
      title: row.title,
      tagId: row.tag_id,
      tagName: row.tag_name || '',
      tagIcon: row.tag_icon || '',
      weight: row.weight,
      repeat: row.repeat_rule || 'daily',
      anchorDate: row.anchor_date,
      weekdays: parseWeekdays(row.weekdays),
      monthDay: row.month_day,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  const habitSelect = `
    SELECT habits.*, tags.name AS tag_name, tags.icon AS tag_icon
    FROM habits
    LEFT JOIN tags ON tags.id = habits.tag_id
  `

  function mapHero(row) {
    const xp = db.prepare('SELECT COALESCE(SUM(weight), 0) AS xp FROM habit_marks WHERE hero_id = ?').get(row.id).xp
    const progress = progressFromXp(xp)
    const race = findRace(row.race_id)
    const klass = findClass(row.class_id)
    const spent = {
      str: row.attr_str,
      agi: row.attr_agi,
      int: row.attr_int,
      con: row.attr_con
    }
    const bases = {
      str: race.str + klass.str,
      agi: race.agi + klass.agi,
      int: race.int + klass.int,
      con: race.con + klass.con
    }
    const stats = {
      str: bases.str + spent.str,
      agi: bases.agi + spent.agi,
      int: bases.int + spent.int,
      con: bases.con + spent.con
    }
    const used = spent.str + spent.agi + spent.int + spent.con
    return {
      id: row.id,
      name: row.name,
      classId: row.class_id,
      raceId: row.race_id,
      classLabel: klass.label,
      raceLabel: race.label,
      active: row.active === 1,
      spent,
      bases,
      stats,
      unspent: Math.max(0, pointsForLevel(progress.level) - used),
      ...progress,
      title: titleForLevel(progress.level)
    }
  }

  return {
    listTags() {
      return db.prepare('SELECT * FROM tags ORDER BY name ASC').all().map(mapTag)
    },

    getTag(id) {
      const row = db.prepare('SELECT * FROM tags WHERE id = ?').get(id)
      return row ? mapTag(row) : null
    },

    createTag({ name, icon }) {
      const tag = { id: randomUUID(), name, icon, createdAt: new Date().toISOString() }
      db.prepare('INSERT INTO tags (id, name, icon, created_at) VALUES (?, ?, ?, ?)').run(
        tag.id,
        tag.name,
        tag.icon,
        tag.createdAt
      )
      return tag
    },

    updateTag(id, patch) {
      const current = this.getTag(id)
      if (!current) return null
      const next = { ...current, ...patch }
      db.prepare('UPDATE tags SET name = ?, icon = ? WHERE id = ?').run(next.name, next.icon, id)
      return this.getTag(id)
    },

    removeTag(id) {
      const used = db.prepare('SELECT COUNT(*) AS count FROM habits WHERE tag_id = ?').get(id).count
      if (used) return 'used'
      return db.prepare('DELETE FROM tags WHERE id = ?').run(id).changes > 0
    },

    listHabits() {
      return db.prepare(`${habitSelect} ORDER BY habits.created_at ASC`).all().map(mapHabit)
    },

    getHabit(id) {
      const row = db.prepare(`${habitSelect} WHERE habits.id = ?`).get(id)
      return row ? mapHabit(row) : null
    },

    createHabit(data) {
      const timestamp = new Date().toISOString()
      const id = randomUUID()
      db.prepare(
        `INSERT INTO habits (
          id, title, tag, tag_id, weight, repeat_rule, anchor_date, weekdays, month_day, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        data.title,
        '',
        data.tagId,
        data.weight,
        data.repeat,
        data.anchorDate,
        JSON.stringify(data.weekdays || []),
        data.monthDay,
        timestamp,
        timestamp
      )
      return this.getHabit(id)
    },

    updateHabit(id, patch) {
      const current = this.getHabit(id)
      if (!current) return null
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
      db.prepare(
        `UPDATE habits
         SET title = ?, tag_id = ?, weight = ?, repeat_rule = ?, anchor_date = ?, weekdays = ?, month_day = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        next.title,
        next.tagId,
        next.weight,
        next.repeat,
        next.anchorDate,
        JSON.stringify(next.weekdays || []),
        next.monthDay,
        next.updatedAt,
        id
      )
      return this.getHabit(id)
    },

    removeHabit(id) {
      return db.prepare('DELETE FROM habits WHERE id = ?').run(id).changes > 0
    },

    listMarks(from, to) {
      return db
        .prepare(
          `SELECT id, habit_id AS habitId, date, weight, hero_id AS heroId
           FROM habit_marks
           WHERE date >= ? AND date <= ?
           ORDER BY date ASC`
        )
        .all(from, to)
    },

    toggleMark(habitId, date) {
      const habit = this.getHabit(habitId)
      if (!habit) return null
      if (!occursOn(habit, date)) return 'off-schedule'
      const existing = db.prepare('SELECT id FROM habit_marks WHERE habit_id = ? AND date = ?').get(habitId, date)
      if (existing) {
        db.prepare('DELETE FROM habit_marks WHERE id = ?').run(existing.id)
        return { marked: false }
      }
      const active = db.prepare('SELECT id FROM heroes WHERE active = 1').get()
      const mark = {
        id: randomUUID(),
        habitId,
        date,
        weight: habit.weight,
        heroId: active?.id || null
      }
      db.prepare(
        'INSERT INTO habit_marks (id, habit_id, date, weight, hero_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(mark.id, mark.habitId, mark.date, mark.weight, mark.heroId, new Date().toISOString())
      return { marked: true, mark }
    },

    getProfile() {
      const row = db.prepare('SELECT id, name, avatar, created_at AS createdAt FROM character WHERE id = ?').get('player')
      const totals = db.prepare('SELECT COALESCE(SUM(weight), 0) AS xp, COUNT(*) AS markCount FROM habit_marks').get()
      const habitCount = db.prepare('SELECT COUNT(*) AS count FROM habits').get().count
      const dates = db.prepare('SELECT DISTINCT date FROM habit_marks').all().map((item) => item.date)
      const progress = progressFromXp(totals.xp)
      const active = db.prepare('SELECT * FROM heroes WHERE active = 1').get()
      return {
        id: row.id,
        name: row.name,
        avatar: row.avatar || null,
        createdAt: row.createdAt,
        ...progress,
        title: titleForLevel(progress.level),
        markCount: totals.markCount,
        habitCount,
        streak: streakFromDates(dates, todayISO()),
        activeHero: active ? { id: active.id, name: active.name, classId: active.class_id, raceId: active.race_id } : null
      }
    },

    updateProfile(patch) {
      const current = this.getProfile()
      const next = {
        name: patch.name ?? current.name,
        avatar: patch.avatar === undefined ? current.avatar : patch.avatar
      }
      db.prepare('UPDATE character SET name = ?, avatar = ?, updated_at = ? WHERE id = ?').run(
        next.name,
        next.avatar,
        new Date().toISOString(),
        'player'
      )
      return this.getProfile()
    },

    listHeroes() {
      return db.prepare('SELECT * FROM heroes ORDER BY created_at ASC').all().map(mapHero)
    },

    getHero(id) {
      const row = db.prepare('SELECT * FROM heroes WHERE id = ?').get(id)
      return row ? mapHero(row) : null
    },

    createHero({ name, classId, raceId }) {
      const count = db.prepare('SELECT COUNT(*) AS count FROM heroes').get().count
      const klass = findClass(classId)
      if (count === 0 && !CLASSES.find((item) => item.id === classId)?.starter) return 'locked'
      if (!CLASSES.some((item) => item.id === classId)) return null
      if (klass.id !== classId) return null
      const id = randomUUID()
      db.prepare(
        `INSERT INTO heroes (
          id, name, class_id, race_id, active, attr_str, attr_agi, attr_int, attr_con, created_at
        ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?)`
      ).run(id, name, classId, raceId, count === 0 ? 1 : 0, new Date().toISOString())
      return this.getHero(id)
    },

    renameHero(id, name) {
      if (!this.getHero(id)) return null
      db.prepare('UPDATE heroes SET name = ? WHERE id = ?').run(name, id)
      return this.getHero(id)
    },

    activateHero(id) {
      if (!this.getHero(id)) return null
      db.prepare('UPDATE heroes SET active = 0').run()
      db.prepare('UPDATE heroes SET active = 1 WHERE id = ?').run(id)
      return this.getHero(id)
    },

    spendPoint(id, attr, delta) {
      if (!ATTRS.includes(attr)) return null
      const hero = this.getHero(id)
      if (!hero) return null
      const next = hero.spent[attr] + delta
      if (next < 0) return 'floor'
      if (delta > 0 && hero.unspent < delta) return 'empty'
      db.prepare(`UPDATE heroes SET attr_${attr} = ? WHERE id = ?`).run(next, id)
      return this.getHero(id)
    },

    removeHero(id) {
      const hero = this.getHero(id)
      if (!hero) return false
      db.prepare('DELETE FROM heroes WHERE id = ?').run(id)
      if (hero.active) {
        const next = db.prepare('SELECT id FROM heroes ORDER BY created_at ASC').get()
        if (next) db.prepare('UPDATE heroes SET active = 1 WHERE id = ?').run(next.id)
      }
      return true
    },

    close() {
      db.close()
    }
  }
}

let singleton

export function getStore() {
  if (!singleton) singleton = createStore()
  return singleton
}
