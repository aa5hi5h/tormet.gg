
const OPENDOTA_API_BASE = 'https://api.opendota.com/api'

export interface DotaPlayer {
  account_id: number
  personaname: string
  avatarfull: string
  profileurl: string
}

export interface DotaMatch {
  match_id: number
  player_slot: number
  radiant_win: boolean
  duration: number
  game_mode: number
  lobby_type: number
  start_time: number
  hero_id: number
  kills: number
  deaths: number
  assists: number
}

export interface DotaMatchDetail {
  match_id: number
  radiant_win: boolean
  duration: number
  start_time: number
  radiant_score: number
  dire_score: number
  players: DotaMatchPlayer[]
}

export interface DotaMatchPlayer {
  account_id: number
  player_slot: number
  hero_id: number
  kills: number
  deaths: number
  assists: number
  gold_per_min: number
  xp_per_min: number
}

export async function searchDotaPlayer(playerName: string): Promise<DotaPlayer[]> {
  try {
    const response = await fetch(
      `${OPENDOTA_API_BASE}/search?q=${encodeURIComponent(playerName)}`
    )

    if (!response.ok) {
      console.error('Failed to search player:', response.status)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Error searching Dota player:', error)
    return []
  }
}

export async function getDotaPlayer(accountId: string): Promise<DotaPlayer | null> {
  try {
    const response = await fetch(
      `${OPENDOTA_API_BASE}/players/${accountId}`
    )

    if (!response.ok) {
      console.error('Player not found:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching Dota player:', error)
    return null
  }
}

export async function getRecentDotaMatches(accountId: string, limit: number = 20): Promise<DotaMatch[]> {
  try {
    const response = await fetch(
      `${OPENDOTA_API_BASE}/players/${accountId}/recentMatches?limit=${limit}`
    )

    if (!response.ok) {
      console.error('Failed to fetch recent matches:', response.status)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching recent Dota matches:', error)
    return []
  }
}


export async function getDotaMatchDetails(matchId: number): Promise<DotaMatchDetail | null> {
  try {
    const response = await fetch(
      `${OPENDOTA_API_BASE}/matches/${matchId}`
    )

    if (!response.ok) {
      console.error('Failed to fetch match details:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching Dota match details:', error)
    return null
  }
}


export async function findDotaMatchBetweenPlayers(
  accountId1: string,
  accountId2: string,
  afterTimestamp?: number
): Promise<DotaMatchDetail | null> {
  try {
    const recentMatches = await getRecentDotaMatches(accountId1, 20)
    
    for (const match of recentMatches) {
      if (afterTimestamp && match.start_time * 1000 < afterTimestamp) {
        continue
      }

      const matchDetails = await getDotaMatchDetails(match.match_id)
      
      if (!matchDetails) continue

      const player1 = matchDetails.players.find(
        p => p.account_id === parseInt(accountId1)
      )
      const player2 = matchDetails.players.find(
        p => p.account_id === parseInt(accountId2)
      )

      if (player1 && player2) {
        return matchDetails
      }
    }

    return null
  } catch (error) {
    console.error('Error finding Dota match between players:', error)
    return null
  }
}

export function determineDotaWinner(
  matchDetails: DotaMatchDetail,
  accountId1: string,
  accountId2: string
): 'CREATOR' | 'JOINER' | 'DRAW' {
  const player1 = matchDetails.players.find(
    p => p.account_id === parseInt(accountId1)
  )
  const player2 = matchDetails.players.find(
    p => p.account_id === parseInt(accountId2)
  )

  if (!player1 || !player2) {
    throw new Error('Players not found in match data')
  }

  const player1IsRadiant = player1.player_slot < 128
  const player2IsRadiant = player2.player_slot < 128

  if (player1IsRadiant === player2IsRadiant) {
    return 'DRAW'
  }

  const player1Won = (player1IsRadiant && matchDetails.radiant_win) || 
                     (!player1IsRadiant && !matchDetails.radiant_win)

  return player1Won ? 'CREATOR' : 'JOINER'
}

export function getTeamFromPlayerSlot(playerSlot: number): 'Radiant' | 'Dire' {
  return playerSlot < 128 ? 'Radiant' : 'Dire'
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}