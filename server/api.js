import { readdirSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isValidDate, todayISO } from '../src/lib/dates.js'
import { CLASSES, RACES, TAG_ICONS } from '../src/lib/heroes.js'
import { getStore } from './db.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const FONT_EXT = new Set(['.woff2', '.woff', '.ttf', '.otf'])

function http(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function send(res, status, data) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => {
      chunks.push(chunk)
      if (Buffer.concat(chunks).length > 2_000_000) {
        reject(http(413, 'Payload grande'))
        req.destroy()
      }
    })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim()
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(http(400, 'JSON inválido'))
      }
    })
    req.on('error', reject)
  })
}

function parseTag(body, partial = false) {
  const out = {}
  if (!partial || body.name !== undefined) {
    const name = String(body.name ?? '').trim()
    if (!name || name.length > 24) throw http(400, 'Nome da tag inválido')
    out.name = name
  }
  if (!partial || body.icon !== undefined) {
    const icon = String(body.icon ?? '').trim()
    if (!icon || icon.length > 8 || !TAG_ICONS.includes(icon)) throw http(400, 'Escolha um ícone')
    out.icon = icon
  }
  if (partial && !Object.keys(out).length) throw http(400, 'Nada para atualizar')
  return out
}

function parseSchedule(body) {
  const repeat = String(body.repeat || '')
  if (!['once', 'daily', 'weekly', 'monthly'].includes(repeat)) throw http(400, 'Repetição inválida')
  const anchorDate = String(body.anchorDate || '')
  if (!isValidDate(anchorDate)) throw http(400, 'Data inválida')
  const out = { repeat, anchorDate, weekdays: [], monthDay: null }
  if (repeat === 'weekly') {
    const weekdays = [...new Set((body.weekdays || []).map(Number))].filter((day) => day >= 0 && day <= 6)
    if (!weekdays.length) throw http(400, 'Escolha os dias da semana')
    out.weekdays = weekdays
  }
  if (repeat === 'monthly') {
    const monthDay = Number(body.monthDay || anchorDate.slice(-2))
    if (!Number.isInteger(monthDay) || monthDay < 1 || monthDay > 31) throw http(400, 'Dia do mês inválido')
    out.monthDay = monthDay
  }
  return out
}

function parseHabit(body, partial, store) {
  const out = {}
  if (!partial || body.title !== undefined) {
    const title = String(body.title ?? '').trim()
    if (!title || title.length > 60) throw http(400, 'Título inválido')
    out.title = title
  }
  if (!partial || body.tagId !== undefined) {
    const tagId = String(body.tagId || '')
    if (!store.getTag(tagId)) throw http(400, 'Escolha uma tag')
    out.tagId = tagId
  }
  if (!partial || body.weight !== undefined) {
    const weight = Number(body.weight)
    if (!Number.isInteger(weight) || weight < 1 || weight > 100) {
      throw http(400, 'Peso deve ser um inteiro de 1 a 100')
    }
    out.weight = weight
  }
  if (!partial || body.repeat !== undefined || body.anchorDate !== undefined) {
    Object.assign(out, parseSchedule(body))
  }
  if (partial && !Object.keys(out).length) throw http(400, 'Nada para atualizar')
  return out
}

function parseName(value, label = 'Nome') {
  const name = String(value ?? '').trim()
  if (!name || name.length > 24) throw http(400, `${label} inválido`)
  return name
}

function findFont() {
  const dir = join(root, 'public', 'fontes')
  try {
    const file = readdirSync(dir).find((name) => FONT_EXT.has(extname(name).toLowerCase()))
    return file ? `/fontes/${encodeURIComponent(file)}` : null
  } catch {
    return null
  }
}

async function route(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1')
  const parts = url.pathname.split('/').filter(Boolean)
  const method = req.method || 'GET'
  if (parts[0] !== 'api') {
    send(res, 404, { error: 'Não encontrado' })
    return
  }

  const store = getStore()

  if (parts[1] === 'font' && method === 'GET') {
    send(res, 200, { url: findFont() })
    return
  }

  if (parts[1] === 'tags' && parts.length === 2 && method === 'GET') {
    send(res, 200, store.listTags())
    return
  }

  if (parts[1] === 'tags' && parts.length === 2 && method === 'POST') {
    send(res, 201, store.createTag(parseTag(await readBody(req))))
    return
  }

  if (parts[1] === 'tags' && parts.length === 3 && method === 'PATCH') {
    const updated = store.updateTag(parts[2], parseTag(await readBody(req), true))
    if (!updated) throw http(404, 'Tag não encontrada')
    send(res, 200, updated)
    return
  }

  if (parts[1] === 'tags' && parts.length === 3 && method === 'DELETE') {
    const removed = store.removeTag(parts[2])
    if (removed === 'used') throw http(400, 'Tag em uso')
    if (!removed) throw http(404, 'Tag não encontrada')
    send(res, 200, { ok: true })
    return
  }

  if (parts[1] === 'habits' && parts.length === 2 && method === 'GET') {
    send(res, 200, store.listHabits())
    return
  }

  if (parts[1] === 'habits' && parts.length === 2 && method === 'POST') {
    send(res, 201, store.createHabit(parseHabit(await readBody(req), false, store)))
    return
  }

  if (parts[1] === 'habits' && parts.length === 3 && method === 'PATCH') {
    const updated = store.updateHabit(parts[2], parseHabit(await readBody(req), true, store))
    if (!updated) throw http(404, 'Hábito não encontrado')
    send(res, 200, updated)
    return
  }

  if (parts[1] === 'habits' && parts.length === 3 && method === 'DELETE') {
    if (!store.removeHabit(parts[2])) throw http(404, 'Hábito não encontrado')
    send(res, 200, { ok: true })
    return
  }

  if (parts[1] === 'marks' && method === 'GET') {
    const from = url.searchParams.get('from') || ''
    const to = url.searchParams.get('to') || ''
    if (!isValidDate(from) || !isValidDate(to) || from > to) throw http(400, 'Intervalo inválido')
    send(res, 200, store.listMarks(from, to))
    return
  }

  if (parts[1] === 'marks' && method === 'POST') {
    const body = await readBody(req)
    const date = String(body.date || '')
    if (!isValidDate(date)) throw http(400, 'Data inválida')
    if (date > todayISO()) throw http(400, 'Não é possível marcar um dia futuro')
    const result = store.toggleMark(String(body.habitId || ''), date)
    if (!result) throw http(404, 'Hábito não encontrado')
    if (result === 'off-schedule') throw http(400, 'Hábito não cai neste dia')
    send(res, 200, result)
    return
  }

  if (parts[1] === 'profile' && method === 'GET') {
    send(res, 200, store.getProfile())
    return
  }

  if (parts[1] === 'profile' && method === 'PATCH') {
    const body = await readBody(req)
    const patch = {}
    if (body.name !== undefined) patch.name = parseName(body.name)
    if (body.avatar !== undefined) {
      if (body.avatar === null || body.avatar === '') patch.avatar = null
      else {
        const avatar = String(body.avatar)
        if (!avatar.startsWith('data:image/') || avatar.length > 300_000) throw http(400, 'Imagem inválida')
        patch.avatar = avatar
      }
    }
    if (!Object.keys(patch).length) throw http(400, 'Nada para atualizar')
    send(res, 200, store.updateProfile(patch))
    return
  }

  if (parts[1] === 'heroes' && parts.length === 2 && method === 'GET') {
    send(res, 200, store.listHeroes())
    return
  }

  if (parts[1] === 'heroes' && parts.length === 2 && method === 'POST') {
    const body = await readBody(req)
    const classId = String(body.classId || '')
    const raceId = String(body.raceId || '')
    if (!CLASSES.some((item) => item.id === classId)) throw http(400, 'Classe inválida')
    if (!RACES.some((item) => item.id === raceId)) throw http(400, 'Raça inválida')
    const hero = store.createHero({ name: parseName(body.name, 'Nome do herói'), classId, raceId })
    if (hero === 'locked') throw http(400, 'No começo escolha guerreiro, arqueiro ou mago')
    if (!hero) throw http(400, 'Herói inválido')
    send(res, 201, hero)
    return
  }

  if (parts[1] === 'heroes' && parts.length === 3 && method === 'PATCH') {
    const hero = store.renameHero(parts[2], parseName((await readBody(req)).name, 'Nome do herói'))
    if (!hero) throw http(404, 'Herói não encontrado')
    send(res, 200, hero)
    return
  }

  if (parts[1] === 'heroes' && parts.length === 3 && method === 'DELETE') {
    if (!store.removeHero(parts[2])) throw http(404, 'Herói não encontrado')
    send(res, 200, { ok: true })
    return
  }

  if (parts[1] === 'heroes' && parts[3] === 'activate' && method === 'POST') {
    const hero = store.activateHero(parts[2])
    if (!hero) throw http(404, 'Herói não encontrado')
    send(res, 200, hero)
    return
  }

  if (parts[1] === 'heroes' && parts[3] === 'stats' && method === 'POST') {
    const body = await readBody(req)
    const delta = Number(body.delta)
    if (delta !== 1 && delta !== -1) throw http(400, 'Ajuste inválido')
    const hero = store.spendPoint(parts[2], String(body.attr || ''), delta)
    if (hero === 'floor') throw http(400, 'Atributo já está no mínimo')
    if (hero === 'empty') throw http(400, 'Sem pontos de nível')
    if (!hero) throw http(404, 'Herói não encontrado')
    send(res, 200, hero)
    return
  }

  send(res, 404, { error: 'Não encontrado' })
}

export async function handleApi(req, res) {
  try {
    await route(req, res)
  } catch (err) {
    if (res.writableEnded) return
    const status = err.status || 500
    if (status === 500) console.error(err)
    send(res, status, { error: status === 500 ? 'Erro interno' : err.message })
  }
}

export function apiMiddleware(req, res, next) {
  const pathname = req.url?.split('?')[0] ?? ''
  if (!pathname.startsWith('/api/')) {
    next()
    return
  }
  handleApi(req, res)
}
