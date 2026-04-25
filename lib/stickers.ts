export type StickerSection = 'fwc' | 'team' | 'coca_cola'

export interface TeamDef {
  code: string
  name: string
  group: string
}

export interface StickerDef {
  id: string
  code: string
  name: string
  group: string | null
  number: number
  section: StickerSection
}

export const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const

export const TEAMS: TeamDef[] = [
  { group: 'A', code: 'MEX', name: 'México' },
  { group: 'A', code: 'RSA', name: 'África do Sul' },
  { group: 'A', code: 'KOR', name: 'Coréia do Sul' },
  { group: 'A', code: 'CZE', name: 'Rep. Tcheca' },
  { group: 'B', code: 'CAN', name: 'Canadá' },
  { group: 'B', code: 'BIH', name: 'Bósnia' },
  { group: 'B', code: 'QAT', name: 'Catar' },
  { group: 'B', code: 'SUI', name: 'Suíça' },
  { group: 'C', code: 'BRA', name: 'Brasil' },
  { group: 'C', code: 'MAR', name: 'Marrocos' },
  { group: 'C', code: 'HAI', name: 'Haiti' },
  { group: 'C', code: 'SCO', name: 'Escócia' },
  { group: 'D', code: 'USA', name: 'Estados Unidos' },
  { group: 'D', code: 'PAR', name: 'Paraguai' },
  { group: 'D', code: 'AUS', name: 'Austrália' },
  { group: 'D', code: 'TUR', name: 'Turquia' },
  { group: 'E', code: 'GER', name: 'Alemanha' },
  { group: 'E', code: 'CUW', name: 'Curaçao' },
  { group: 'E', code: 'CIV', name: 'Costa do Marfim' },
  { group: 'E', code: 'ECU', name: 'Equador' },
  { group: 'F', code: 'NED', name: 'Holanda' },
  { group: 'F', code: 'JPN', name: 'Japão' },
  { group: 'F', code: 'SWE', name: 'Suécia' },
  { group: 'F', code: 'TUN', name: 'Tunísia' },
  { group: 'G', code: 'BEL', name: 'Bélgica' },
  { group: 'G', code: 'EGY', name: 'Egito' },
  { group: 'G', code: 'IRN', name: 'Irã' },
  { group: 'G', code: 'NZL', name: 'Nova Zelândia' },
  { group: 'H', code: 'ESP', name: 'Espanha' },
  { group: 'H', code: 'CPV', name: 'Cabo Verde' },
  { group: 'H', code: 'KSA', name: 'Arábia Saudita' },
  { group: 'H', code: 'URU', name: 'Uruguai' },
  { group: 'I', code: 'FRA', name: 'França' },
  { group: 'I', code: 'SEN', name: 'Senegal' },
  { group: 'I', code: 'IRQ', name: 'Iraque' },
  { group: 'I', code: 'NOR', name: 'Noruega' },
  { group: 'J', code: 'ARG', name: 'Argentina' },
  { group: 'J', code: 'ALG', name: 'Argélia' },
  { group: 'J', code: 'AUT', name: 'Áustria' },
  { group: 'J', code: 'JOR', name: 'Jordânia' },
  { group: 'K', code: 'POR', name: 'Portugal' },
  { group: 'K', code: 'COD', name: 'Congo' },
  { group: 'K', code: 'UZB', name: 'Uzbequistão' },
  { group: 'K', code: 'COL', name: 'Colômbia' },
  { group: 'L', code: 'ENG', name: 'Inglaterra' },
  { group: 'L', code: 'CRO', name: 'Croácia' },
  { group: 'L', code: 'GHA', name: 'Gana' },
  { group: 'L', code: 'PAN', name: 'Panamá' },
]

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function generateStickers(): StickerDef[] {
  const stickers: StickerDef[] = []

  for (let i = 0; i <= 19; i++) {
    stickers.push({
      id: `FWC-${pad(i)}`,
      code: 'FWC',
      name: i <= 8 ? 'Página Inicial' : 'FIFA World Cup History',
      group: null,
      number: i,
      section: 'fwc',
    })
  }

  for (const team of TEAMS) {
    for (let i = 1; i <= 20; i++) {
      stickers.push({
        id: `${team.code}-${pad(i)}`,
        code: team.code,
        name: team.name,
        group: team.group,
        number: i,
        section: 'team',
      })
    }
  }

  for (let i = 1; i <= 14; i++) {
    stickers.push({
      id: `CC-${pad(i)}`,
      code: 'CC',
      name: 'Coca-Cola',
      group: null,
      number: i,
      section: 'coca_cola',
    })
  }

  return stickers
}

export const ALL_STICKERS = generateStickers()
export const STICKER_MAP = new Map(ALL_STICKERS.map(s => [s.id, s]))
export const TOTAL_STICKERS = ALL_STICKERS.length

export function getTeamStickers(teamCode: string): StickerDef[] {
  return ALL_STICKERS.filter(s => s.code === teamCode)
}

export function getGroupTeams(group: string): TeamDef[] {
  return TEAMS.filter(t => t.group === group)
}
