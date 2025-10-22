const CLASH_ROYALE_API_KEY = process.env.CLASH_ROYALE_API_KEY!
const CLASH_ROYALE_API_BASE = 'https://api.clashroyale.com/v1'

export interface ClashRoyalePlayer {
  tag: string
  name: string
  expLevel: number
  trophies: number
  bestTrophies: number
  wins: number
  losses: number
  battleCount: number
  threeCrownWins: number
  arena: {
    id: number
    name: string
  }
  clan?: {
    tag: string
    name: string
  }
}

export interface ClashRoyaleBattle {
  type: string
  battleTime: string // ISO timestamp
  isLadderTournament: boolean
  arena: {
    id: number
    name: string
  }
  gameMode: {
    id: number
    name: string
  }
  deckSelection: string
  team: ClashRoyaleBattlePlayer[]
  opponent: ClashRoyaleBattlePlayer[]
}

export interface ClashRoyaleBattlePlayer {
  tag: string
  name: string
  startingTrophies?: number
  trophyChange?: number
  crowns: number
  kingTowerHitPoints?: number
  princessTowersHitPoints?: number[]
  cards: any[]
}

export async function getClashRoyalePlayer(playerTag: string): Promise<ClashRoyalePlayer | null> {
  try {
    const encodedTag = encodeURIComponent(playerTag.startsWith('#') ? playerTag : `#${playerTag}`)
    
    const response = await fetch(
      `${CLASH_ROYALE_API_BASE}/players/${encodedTag}`,
      {
        headers: {
          'Authorization': `Bearer ${CLASH_ROYALE_API_KEY}`,
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
    console.error('Error fetching Clash Royale player:', error)
    return null
  }
}


export async function getClashRoyaleBattleLog(playerTag: string): Promise<ClashRoyaleBattle[]> {
  try {
    const encodedTag = encodeURIComponent(playerTag.startsWith('#') ? playerTag : `#${playerTag}`)
    
    const response = await fetch(
      `${CLASH_ROYALE_API_BASE}/players/${encodedTag}/battlelog`,
      {
        headers: {
          'Authorization': `Bearer ${CLASH_ROYALE_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch battle log:', response.status)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching Clash Royale battle log:', error)
    return []
  }
}

export async function findClashRoyaleBattleBetweenPlayers(
  playerTag1: string,
  playerTag2: string,
  afterTimestamp?: number
): Promise<ClashRoyaleBattle | null> {
  try {
    const battleLog = await getClashRoyaleBattleLog(playerTag1)
    
    const normalizedTag2 = playerTag2.replace('#', '').toUpperCase()
    
    for (const battle of battleLog) {
      if (battle.type !== 'PvP' && battle.type !== 'challenge') {
        continue
      }
      
      if (afterTimestamp && new Date(battle.battleTime).getTime() < afterTimestamp) {
        continue
      }
      
      if (battle.opponent && battle.opponent.length > 0) {
        const opponentTag = battle.opponent[0].tag.replace('#', '').toUpperCase()
        
        if (opponentTag === normalizedTag2) {
          return battle
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error finding Clash Royale battle between players:', error)
    return null
  }
}

export function determineClashRoyaleWinner(
  battle: ClashRoyaleBattle,
  playerTag1: string,
  playerTag2: string
): 'CREATOR' | 'JOINER' | 'DRAW' {
  if (!battle.team || !battle.opponent || battle.team.length === 0 || battle.opponent.length === 0) {
    throw new Error('Invalid battle data')
  }
  
  const player1Crowns = battle.team[0].crowns
  const player2Crowns = battle.opponent[0].crowns
  
  if (player1Crowns === player2Crowns) {
    return 'DRAW'
  }
  
  return player1Crowns > player2Crowns ? 'CREATOR' : 'JOINER'
}


export function isValidClashRoyaleTag(tag: string): boolean {
  const cleanTag = tag.replace('#', '')
  return /^[0-9A-Z]{8,9}$/i.test(cleanTag)
}

export function formatClashRoyaleTag(tag: string): string {
  const cleanTag = tag.replace('#', '').toUpperCase()
  return `#${cleanTag}`
}