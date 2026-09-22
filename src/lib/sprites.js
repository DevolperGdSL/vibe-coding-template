export const SPRITE_W = 32
export const SPRITE_H = 40

export const STAGES = [
  { level: 1, label: 'Recruta' },
  { level: 5, label: 'Equipado' },
  { level: 15, label: 'Capa' },
  { level: 30, label: 'Arma viva' },
  { level: 50, label: 'Insígnia' },
  { level: 75, label: 'Aura' }
]

const SKIN = {
  humano: { base: '#e8b48a', shade: '#c48b62', hair: '#3a2a1c', eye: '#1a1e28' },
  elfo: { base: '#f6d7b5', shade: '#ddb48c', hair: '#ece4d4', eye: '#2f6b4f' },
  anao: { base: '#d9926a', shade: '#b56b45', hair: '#8a3f22', eye: '#1a1e28' },
  orc: { base: '#6f9a44', shade: '#4c732c', hair: '#1b2414', eye: '#e6c15a' }
}

const THEME = {
  guerreiro: {
    cloth: '#232733',
    shade: '#12141c',
    trim: '#6d7588',
    metal: '#d5d0c6',
    gem: '#9a3040'
  },
  arqueiro: {
    cloth: '#3e6b45',
    shade: '#243c28',
    trim: '#c4a574',
    metal: '#efe6d4',
    gem: '#7dcea0'
  },
  mago: {
    cloth: '#4a3b78',
    shade: '#2a2148',
    trim: '#b7a6e6',
    metal: '#8a6238',
    gem: '#7ec8e8'
  },
  tank: {
    cloth: '#66758a',
    shade: '#3c4658',
    trim: '#d5dbe6',
    metal: '#e7e1d4',
    gem: '#3e6ea5'
  },
  clerigo: {
    cloth: '#f4efe4',
    shade: '#cfc6b2',
    trim: '#e6c15a',
    metal: '#efe6d4',
    gem: '#f7f3ea'
  }
}

export function stageForLevel(level) {
  if (level >= 75) return 5
  if (level >= 50) return 4
  if (level >= 30) return 3
  if (level >= 15) return 2
  if (level >= 5) return 1
  return 0
}

function blank() {
  return Array.from({ length: SPRITE_H }, () => Array(SPRITE_W).fill(null))
}

function pix(grid, x, y, color) {
  if (!color || x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return
  grid[y][x] = color
}

function box(grid, x, y, w, h, fill, shade = fill) {
  for (let dy = 0; dy < h; dy += 1) {
    for (let dx = 0; dx < w; dx += 1) {
      const edge = dx === 0 || dy === h - 1
      pix(grid, x + dx, y + dy, edge ? shade : fill)
    }
  }
}

function layout(raceId) {
  const dwarf = raceId === 'anao'
  const orc = raceId === 'orc'
  return {
    dwarf,
    orc,
    headX: orc ? 10 : 12,
    headY: dwarf ? 12 : 8,
    headW: orc ? 12 : 8,
    headH: dwarf ? 7 : 8,
    bodyX: dwarf ? 10 : 11,
    bodyY: dwarf ? 20 : 16,
    bodyW: dwarf ? 12 : 10,
    bodyH: dwarf ? 8 : 11,
    legH: dwarf ? 5 : 7
  }
}

function drawCape(grid, theme, body) {
  box(grid, body.bodyX - 2, body.bodyY + 1, body.bodyW + 4, body.bodyH + 4, theme.shade, '#0e1016')
  pix(grid, body.bodyX - 2, body.bodyY + 1, theme.trim)
  pix(grid, body.bodyX + body.bodyW + 1, body.bodyY + 1, theme.trim)
}

function drawLegs(grid, theme, body) {
  const y = body.bodyY + body.bodyH
  const gap = body.dwarf ? 2 : 1
  const w = body.dwarf ? 4 : 3
  box(grid, body.bodyX + 1, y, w, body.legH, theme.shade, '#12141c')
  box(grid, body.bodyX + body.bodyW - w - 1, y, w, body.legH, theme.shade, '#12141c')
  const footY = y + body.legH - 1
  box(grid, body.bodyX, footY, w + 1, 3, '#4a3424', '#2a1c12')
  box(grid, body.bodyX + body.bodyW - w - 1, footY, w + 1, 3, '#4a3424', '#2a1c12')
  box(grid, 8, 38, 16, 2, '#0b0e14', '#0b0e14')
  void gap
}

function drawBody(grid, theme, stage, body) {
  box(grid, body.bodyX, body.bodyY, body.bodyW, body.bodyH, theme.cloth, theme.shade)
  for (let dx = 1; dx < body.bodyW - 1; dx += 2) {
    pix(grid, body.bodyX + dx, body.bodyY + 2, theme.trim)
  }
  if (stage >= 1) {
    box(grid, body.bodyX, body.bodyY + body.bodyH - 2, body.bodyW, 2, theme.trim, theme.shade)
  }
  if (stage >= 4) {
    pix(grid, body.bodyX + 1, body.bodyY + 3, theme.gem)
    pix(grid, body.bodyX + body.bodyW - 2, body.bodyY + 3, theme.gem)
    pix(grid, body.bodyX + Math.floor(body.bodyW / 2), body.bodyY + 5, theme.gem)
  }
}

function drawArms(grid, theme, skin, body) {
  box(grid, body.bodyX - 3, body.bodyY + 1, 3, 8, theme.cloth, theme.shade)
  box(grid, body.bodyX + body.bodyW, body.bodyY + 1, 3, 8, theme.cloth, theme.shade)
  box(grid, body.bodyX - 3, body.bodyY + 8, 3, 3, skin.base, skin.shade)
  box(grid, body.bodyX + body.bodyW, body.bodyY + 8, 3, 3, skin.base, skin.shade)
}

function drawFace(grid, skin, raceId, body) {
  const { headX, headY, headW, headH } = body
  box(grid, headX, headY, headW, headH, skin.base, skin.shade)
  const eyeY = headY + 3
  const left = headX + (raceId === 'orc' ? 3 : 2)
  const right = headX + headW - (raceId === 'orc' ? 4 : 3)
  pix(grid, left, eyeY, skin.eye)
  pix(grid, right, eyeY, skin.eye)
  pix(grid, left + 1, eyeY, '#f7f3ea')
  pix(grid, right + 1, eyeY, '#f7f3ea')
  pix(grid, headX + Math.floor(headW / 2), eyeY + 2, skin.shade)
  pix(grid, headX + Math.floor(headW / 2) - 1, eyeY + 3, '#8a3d4a')
  pix(grid, headX + Math.floor(headW / 2), eyeY + 3, '#8a3d4a')

  if (raceId === 'orc') {
    pix(grid, left - 1, eyeY - 1, skin.shade)
    pix(grid, right + 1, eyeY - 1, skin.shade)
    pix(grid, headX + 3, headY + headH - 1, '#f4f0e4')
    pix(grid, headX + headW - 4, headY + headH - 1, '#f4f0e4')
    pix(grid, headX + 3, headY + headH, '#f4f0e4')
    pix(grid, headX + headW - 4, headY + headH, '#f4f0e4')
  }

  if (raceId === 'elfo') {
    pix(grid, headX - 1, eyeY, skin.base)
    pix(grid, headX - 2, eyeY - 1, skin.base)
    pix(grid, headX - 2, eyeY - 2, skin.shade)
    pix(grid, headX + headW, eyeY, skin.base)
    pix(grid, headX + headW + 1, eyeY - 1, skin.base)
    pix(grid, headX + headW + 1, eyeY - 2, skin.shade)
  }
}

function drawHair(grid, skin, body) {
  box(grid, body.headX, body.headY - 2, body.headW, 3, skin.hair, '#1a120c')
  pix(grid, body.headX, body.headY + 1, skin.hair)
  pix(grid, body.headX + body.headW - 1, body.headY + 1, skin.hair)
}

function drawBeard(grid, skin, body) {
  box(grid, body.headX + 1, body.headY + body.headH - 2, body.headW - 2, 7, skin.hair, '#5a2e16')
  pix(grid, body.headX + Math.floor(body.headW / 2), body.headY + body.headH + 4, skin.shade)
}

function drawWarriorHead(grid, theme, stage, body) {
  box(grid, body.headX - 1, body.headY - 3, body.headW + 2, 5, theme.cloth, theme.shade)
  box(grid, body.headX + 1, body.headY + 2, body.headW - 2, 2, '#0e1016', '#0e1016')
  if (stage >= 1) pix(grid, body.headX + Math.floor(body.headW / 2), body.headY - 3, theme.gem)
  if (stage >= 5) {
    pix(grid, body.headX + 2, body.headY - 4, theme.trim)
    pix(grid, body.headX + body.headW - 3, body.headY - 4, theme.trim)
  }
}

function drawHood(grid, theme, body) {
  box(grid, body.headX - 1, body.headY - 3, body.headW + 2, 4, theme.shade, '#12180f')
  pix(grid, body.headX - 1, body.headY + 1, theme.shade)
  pix(grid, body.headX + body.headW, body.headY + 1, theme.shade)
  pix(grid, body.headX - 1, body.headY + 4, theme.cloth)
  pix(grid, body.headX + body.headW, body.headY + 4, theme.cloth)
}

function drawHat(grid, theme, stage, body) {
  const cx = body.headX + Math.floor(body.headW / 2)
  box(grid, body.headX - 2, body.headY - 1, body.headW + 4, 2, theme.cloth, theme.shade)
  for (let i = 0; i < 6; i += 1) {
    const inset = Math.floor(i / 2)
    box(grid, cx - 2 + inset, body.headY - 7 + i, 5 - inset * 2, 1, theme.cloth, theme.shade)
  }
  pix(grid, cx, body.headY - 8, stage >= 3 ? theme.gem : theme.trim)
}

function drawTankHead(grid, theme, body) {
  box(grid, body.headX - 2, body.headY - 3, body.headW + 4, 6, theme.cloth, theme.shade)
  box(grid, body.headX + 2, body.headY + 2, body.headW - 4, 2, '#0e1016', '#0e1016')
  pix(grid, body.headX + Math.floor(body.headW / 2), body.headY + 2, theme.trim)
}

function drawCirclet(grid, theme, stage, body) {
  box(grid, body.headX, body.headY - 1, body.headW, 2, theme.trim, '#9a7a2e')
  pix(grid, body.headX + Math.floor(body.headW / 2), body.headY - 2, stage >= 3 ? '#f7f3ea' : theme.gem)
}

function drawSword(grid, theme, stage, body) {
  const x = body.bodyX + body.bodyW + 3
  const y = body.bodyY - 2
  box(grid, x, y, 2, 14, theme.metal, '#8e96a8')
  pix(grid, x, y, stage >= 3 ? theme.gem : '#f7f3ea')
  box(grid, x - 2, y + 13, 6, 2, '#8a6238', '#4e301f')
  pix(grid, x, y + 15, theme.trim)
  if (stage >= 3) pix(grid, x + 2, y + 2, theme.gem)
}

function drawBow(grid, theme, stage, body) {
  const x = body.bodyX - 6
  const y = body.bodyY
  for (let i = 0; i < 12; i += 1) {
    const bend = i < 2 || i > 9 ? 1 : 0
    pix(grid, x + bend, y + i, theme.trim)
  }
  for (let i = 2; i < 10; i += 1) pix(grid, x + 2, y + i, theme.metal)
  pix(grid, x + 1, y + 5, stage >= 3 ? theme.gem : theme.trim)
  pix(grid, x + 3, y + 1, theme.trim)
}

function drawStaff(grid, theme, stage, body) {
  const x = body.bodyX + body.bodyW + 3
  box(grid, x, body.headY - 2, 2, 24, theme.metal, '#5a3b24')
  box(grid, x - 1, body.headY - 5, 4, 4, stage >= 3 ? '#f7f3ea' : theme.gem, theme.shade)
  if (stage >= 5) pix(grid, x, body.headY - 6, theme.trim)
}

function drawShield(grid, theme, stage, body) {
  box(grid, body.bodyX - 8, body.bodyY, 7, 12, theme.gem, theme.shade)
  box(grid, body.bodyX - 6, body.bodyY + 2, 3, 8, theme.trim, theme.shade)
  pix(grid, body.bodyX - 5, body.bodyY + 5, stage >= 3 ? '#f7f3ea' : theme.cloth)
}

function drawMace(grid, theme, stage, body) {
  const x = body.bodyX + body.bodyW + 3
  box(grid, x, body.bodyY + 2, 2, 12, '#8a6238', '#4e301f')
  box(grid, x - 1, body.bodyY - 1, 4, 4, theme.trim, '#9a7a2e')
  if (stage >= 3) pix(grid, x, body.bodyY - 2, '#f7f3ea')
}

function drawHalo(grid, body) {
  const y = body.headY - 6
  const x = body.headX + 1
  for (let dx = 0; dx < body.headW - 2; dx += 1) pix(grid, x + dx, y, '#e6c15a')
  pix(grid, x - 1, y + 1, '#e6c15a')
  pix(grid, x + body.headW - 2, y + 1, '#e6c15a')
}

function drawClassMark(grid, classId, theme, body) {
  const x = body.bodyX + Math.floor(body.bodyW / 2) - 1
  const y = body.bodyY + 4
  if (classId === 'clerigo') {
    pix(grid, x + 1, y, theme.trim)
    pix(grid, x, y + 1, theme.trim)
    pix(grid, x + 1, y + 1, theme.trim)
    pix(grid, x + 2, y + 1, theme.trim)
    pix(grid, x + 1, y + 2, theme.trim)
    pix(grid, x + 1, y + 3, theme.trim)
  }
  if (classId === 'mago') pix(grid, x + 1, y + 1, theme.gem)
}

export function pixelsForHero({ classId = 'guerreiro', raceId = 'humano', level = 1 } = {}) {
  const grid = blank()
  const theme = THEME[classId] || THEME.guerreiro
  const skin = SKIN[raceId] || SKIN.humano
  const body = layout(raceId)
  const stage = stageForLevel(level)

  if (stage >= 2) drawCape(grid, theme, body)
  drawLegs(grid, theme, body)
  drawBody(grid, theme, stage, body)
  drawArms(grid, theme, skin, body)
  drawFace(grid, skin, raceId, body)
  if (raceId !== 'orc') drawHair(grid, skin, body)

  if (classId === 'guerreiro') drawWarriorHead(grid, theme, stage, body)
  if (classId === 'arqueiro') drawHood(grid, theme, body)
  if (classId === 'mago') drawHat(grid, theme, stage, body)
  if (classId === 'tank') drawTankHead(grid, theme, body)
  if (classId === 'clerigo') drawCirclet(grid, theme, stage, body)
  if (raceId === 'elfo') {
    const eyeY = body.headY + 3
    pix(grid, body.headX - 2, eyeY - 2, skin.shade)
    pix(grid, body.headX + body.headW + 1, eyeY - 2, skin.shade)
  }
  if (raceId === 'anao') drawBeard(grid, skin, body)

  if (classId === 'guerreiro') drawSword(grid, theme, stage, body)
  if (classId === 'arqueiro') drawBow(grid, theme, stage, body)
  if (classId === 'mago') drawStaff(grid, theme, stage, body)
  if (classId === 'tank') drawShield(grid, theme, stage, body)
  if (classId === 'clerigo') drawMace(grid, theme, stage, body)
  drawClassMark(grid, classId, theme, body)
  if (stage >= 5) drawHalo(grid, body)

  return grid
}

export function pixelsForLevel(level) {
  return pixelsForHero({ level })
}
