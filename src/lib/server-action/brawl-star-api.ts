const BRAWL_STARS_API_KEY = process.env.BRAWL_STARS_API_KEY!
const BRAWL_STARS_API_BASE = 'https://api.brawlstars.com/v1'

export interface BrawlStarsPlayer {
  tag: string
  name: string
  nameColor: string
  trophies: number
  highestTrophies: number
  expLevel: number
  expPoints: number
  isQualifiedFromChampionshipChallenge: boolean
  '3vs3Victories': number
  soloVictories: number
  duoVictories: number
  bestRoboRumbleTime: number
  bestTimeAsBigBrawler: number
  club?: {
    tag: string
    name: string
  }
  brawlers: BrawlStarsBrawler[]
}

export interface BrawlStarsBrawler {
  id: number
  name: string
  power: number
  rank: number
  trophies: number
  highestTrophies: number
}

export interface BrawlStarsBattle {
  battleTime: string // ISO timestamp
  event: {
    id: number
    mode: string
    map: string
  }
  battle: {
    mode: string
    type: string
    result?: string // 'victory' or 'defeat'
    duration?: number
    trophyChange?: number
    starPlayer?: {
      tag: string
      name: string
    }
    teams?: BrawlStarsBattleTeam[][]
  }
}

export interface BrawlStarsBattleTeam {
  tag: string
  name: string
  brawler: {
    id: number
    name: string
    power: number
    trophies: number
  }
}

export async function getBrawlStarsPlayer(playerTag: string): Promise<BrawlStarsPlayer | null> {
  try {
    const encodedTag = encodeURIComponent(playerTag.startsWith('#') ? playerTag : `#${playerTag}`)
    
    const response = await fetch(
      `${BRAWL_STARS_API_BASE}/players/${encodedTag}`,
      {
        headers: {
          'Authorization': `Bearer ${BRAWL_STARS_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error('Player not found:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching Brawl Stars player:', error)
    return null
  }
}

export async function getBrawlStarsBattleLog(playerTag: string): Promise<BrawlStarsBattle[]> {
  try {
    const encodedTag = encodeURIComponent(playerTag.startsWith('#') ? playerTag : `#${playerTag}`)
    
    const response = await fetch(
      `${BRAWL_STARS_API_BASE}/players/${encodedTag}/battlelog`,
      {
        headers: {
          'Authorization': `Bearer ${BRAWL_STARS_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch battle log:', response.status)
      return []
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Error fetching Brawl Stars battle log:', error)
    return []
  }
}

export async function findBrawlStarsBattleBetweenPlayers(
  playerTag1: string,
  playerTag2: string,
  afterTimestamp?: number
): Promise<BrawlStarsBattle | null> {
  try {
    const battleLog = await getBrawlStarsBattleLog(playerTag1)
    
    const normalizedTag2 = playerTag2.replace('#', '').toUpperCase()
    
    for (const battle of battleLog) {
      if (afterTimestamp && new Date(battle.battleTime).getTime() < afterTimestamp) {
        continue
      }
      
      if (!battle.battle.teams || battle.battle.teams.length === 0) {
        continue
      }
      
      let foundPlayer2 = false
      let player1Team = -1
      let player2Team = -1
      
      battle.battle.teams.forEach((team, teamIndex) => {
        team.forEach((player) => {
          const playerTag = player.tag.replace('#', '').toUpperCase()
          
          if (playerTag === normalizedTag2) {
            foundPlayer2 = true
            player2Team = teamIndex
          }
          
          const normalizedTag1 = playerTag1.replace('#', '').toUpperCase()
          if (playerTag === normalizedTag1) {
            player1Team = teamIndex
          }
        })
      })
      
      if (foundPlayer2 && player1Team !== player2Team) {
        return battle
      }
    }
    
    return null
  } catch (error) {
    console.error('Error finding Brawl Stars battle between players:', error)
    return null
  }
}

export function determineBrawlStarsWinner(
  battle: BrawlStarsBattle,
  playerTag1: string,
  playerTag2: string
): 'CREATOR' | 'JOINER' | 'DRAW' {
  if (!battle.battle.teams || battle.battle.teams.length === 0) {
    throw new Error('Invalid battle data')
  }
  
  const normalizedTag1 = playerTag1.replace('#', '').toUpperCase()
  const normalizedTag2 = playerTag2.replace('#', '').toUpperCase()
  
  let player1Team = -1
  let player2Team = -1
  
  battle.battle.teams.forEach((team, teamIndex) => {
    team.forEach((player) => {
      const playerTag = player.tag.replace('#', '').toUpperCase()
      
      if (playerTag === normalizedTag1) {
        player1Team = teamIndex
      }
      if (playerTag === normalizedTag2) {
        player2Team = teamIndex
      }
    })
  })
  
  if (player1Team === -1 || player2Team === -1) {
    throw new Error('Players not found in battle')
  }
  
  if (player1Team === player2Team) {
    return 'DRAW'
  }
  
  if (battle.battle.result === 'victory') {
    return 'CREATOR'
  } else if (battle.battle.result === 'defeat') {
    return 'JOINER'
  }
  
  return 'DRAW'
}

export function isValidBrawlStarsTag(tag: string): boolean {
  const cleanTag = tag.replace('#', '')
  return /^[0-9A-Z]{8,9}$/i.test(cleanTag)
}

export function formatBrawlStarsTag(tag: string): string {
  const cleanTag = tag.replace('#', '').toUpperCase()
  return `#${cleanTag}`
}