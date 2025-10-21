const STEAM_API_KEY = process.env.STEAM_API_KEY!
const STEAM_API_BASE = 'https://api.steampowered.com'

export interface SteamPlayer {
  steamid: string
  personaname: string
  profileurl: string
  avatar: string
  avatarmedium: string
  avatarfull: string
}

export interface CSGOMatchStats {
  steamid: string
  kills: number
  deaths: number
  assists: number
  mvps: number
  score: number
  time_played: number
}

export interface CSGOPlayerStats {
  steamID: string
  stats: {
    total_kills: number
    total_deaths: number
    total_time_played: number
    total_planted_bombs: number
    total_defused_bombs: number
    total_wins: number
    total_damage_done: number
    total_money_earned: number
    total_mvps: number
    total_matches_played: number
    total_rounds_played: number
  }
}

export async function resolveSteamVanityURL(vanityUrl: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_API_KEY}&vanityurl=${vanityUrl}`
    )

    if (!response.ok) {
      console.error('Failed to resolve vanity URL:', response.status)
      return null
    }

    const data = await response.json()
    
    if (data.response.success === 1) {
      return data.response.steamid
    }
    
    return null
  } catch (error) {
    console.error('Error resolving Steam vanity URL:', error)
    return null
  }
}


export async function getSteamPlayer(steamId: string): Promise<SteamPlayer | null> {
  try {
    const response = await fetch(
      `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`
    )

    if (!response.ok) {
      console.error('Failed to fetch Steam player:', response.status)
      return null
    }

    const data = await response.json()
    
    if (data.response.players && data.response.players.length > 0) {
      return data.response.players[0]
    }
    
    return null
  } catch (error) {
    console.error('Error fetching Steam player:', error)
    return null
  }
}

export async function getCSGOPlayerStats(steamId: string): Promise<CSGOPlayerStats | null> {
  try {
    const response = await fetch(
      `${STEAM_API_BASE}/ISteamUserStats/GetUserStatsForGame/v2/?appid=730&key=${STEAM_API_KEY}&steamid=${steamId}`
    )

    if (!response.ok) {
      console.error('Failed to fetch CS:GO stats:', response.status)
      return null
    }

    const data = await response.json()
    
    if (data.playerstats && data.playerstats.stats) {
      const statsObject: any = {
        steamID: data.playerstats.steamID
      }
      
      const stats: any = {}
      data.playerstats.stats.forEach((stat: any) => {
        stats[stat.name] = stat.value
      })
      
      statsObject.stats = stats
      return statsObject
    }
    
    return null
  } catch (error) {
    console.error('Error fetching CS:GO stats:', error)
    return null
  }
}

export function isValidSteamId(steamId: string): boolean {
  return /^\d{17}$/.test(steamId)
}

export function convertToSteamId64(input: string): string | null {
  if (isValidSteamId(input)) {
    return input
  }
  
  // TODO: Add more conversion logic if needed (SteamID3, SteamID, etc.)
  return null
}

export interface CSGOMatchSnapshot {
  steamId: string
  timestamp: number
  stats: {
    total_kills: number
    total_deaths: number
    total_wins: number
    total_mvps: number
    total_matches_played: number
  }
}

export async function captureCSGOStatsSnapshot(steamId: string): Promise<CSGOMatchSnapshot | null> {
  try {
    const stats = await getCSGOPlayerStats(steamId)
    
    if (!stats) return null
    
    return {
      steamId,
      timestamp: Date.now(),
      stats: {
        total_kills: stats.stats.total_kills || 0,
        total_deaths: stats.stats.total_deaths || 0,
        total_wins: stats.stats.total_wins || 0,
        total_mvps: stats.stats.total_mvps || 0,
        total_matches_played: stats.stats.total_matches_played || 0
      }
    }
  } catch (error) {
    console.error('Error capturing CS:GO stats snapshot:', error)
    return null
  }
}

export function compareCSGOSnapshots(
  before1: CSGOMatchSnapshot,
  after1: CSGOMatchSnapshot,
  before2: CSGOMatchSnapshot,
  after2: CSGOMatchSnapshot
): 'CREATOR' | 'JOINER' | 'DRAW' | null {
  const player1Played = after1.stats.total_matches_played > before1.stats.total_matches_played
  const player2Played = after2.stats.total_matches_played > before2.stats.total_matches_played
  
  if (!player1Played || !player2Played) {
    return null
  }
  

  const player1Wins = after1.stats.total_wins - before1.stats.total_wins
  const player2Wins = after2.stats.total_wins - before2.stats.total_wins
  
  if (player1Wins === player2Wins) {
    return 'DRAW'
  }
  
  return player1Wins > player2Wins ? 'CREATOR' : 'JOINER'
}

export interface CSGOMatchResult {
  matchId: string
  player1Score: number
  player2Score: number
  screenshotUrl?: string
  submittedBy: string
  verifiedBy?: string
}

export async function getRecentPerformance(steamId: string): Promise<{
  avgKills: number
  avgDeaths: number
  winRate: number
} | null> {
  try {
    const stats = await getCSGOPlayerStats(steamId)
    
    if (!stats) return null
    
    const totalMatches = stats.stats.total_matches_played || 1
    
    return {
      avgKills: (stats.stats.total_kills || 0) / totalMatches,
      avgDeaths: (stats.stats.total_deaths || 0) / totalMatches,
      winRate: ((stats.stats.total_wins || 0) / totalMatches) * 100
    }
  } catch (error) {
    console.error('Error getting recent performance:', error)
    return null
  }
}