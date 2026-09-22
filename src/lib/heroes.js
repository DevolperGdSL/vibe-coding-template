export const RACES = [
  { id: 'humano', label: 'Humano', str: 2, agi: 2, int: 2, con: 2 },
  { id: 'elfo', label: 'Elfo', str: 1, agi: 4, int: 3, con: 1 },
  { id: 'anao', label: 'Anão', str: 3, agi: 1, int: 2, con: 4 },
  { id: 'orc', label: 'Orc', str: 4, agi: 1, int: 1, con: 3 }
]

export const CLASSES = [
  { id: 'guerreiro', label: 'Guerreiro', starter: true, str: 3, agi: 1, int: 0, con: 2 },
  { id: 'arqueiro', label: 'Arqueiro', starter: true, str: 1, agi: 3, int: 1, con: 1 },
  { id: 'mago', label: 'Mago', starter: true, str: 0, agi: 1, int: 4, con: 1 },
  { id: 'tank', label: 'Tank', starter: false, str: 2, agi: 0, int: 0, con: 4 },
  { id: 'clerigo', label: 'Clérigo', starter: false, str: 1, agi: 0, int: 2, con: 3 }
]

export const ATTRS = [
  { id: 'str', label: 'Força' },
  { id: 'agi', label: 'Agilidade' },
  { id: 'int', label: 'Inteligência' },
  { id: 'con', label: 'Constituição' }
]

export const TAG_ICONS = ['🏠', '🏫', '💪', '📚', '💧', '🧘', '💼', '🎮', '🌙', '🍎', '🏃', '🎵', '🧹', '💊', '✍️', '🌿']

export function findClass(id) {
  return CLASSES.find((item) => item.id === id) || CLASSES[0]
}

export function findRace(id) {
  return RACES.find((item) => item.id === id) || RACES[0]
}
