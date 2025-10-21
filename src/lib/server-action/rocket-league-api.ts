const ROCKET_LEAGUE_API_BASE = 'https://api.tracker.gg/api/v2/rocket-league'
const API_KEY = process.env.TRACKER_NETWORK_API_KEY!

export interface RocketLeaguePlayer {
  platformId: string
  platformSlug: string
  platformUserIdentifier: string
  platformUserHandle: string
  avatarUrl?: string
}

export interface RocketLeagueStats {
  platformId: string
  platformUserHandle: string
  segments: {
    type: string
    metadata: {
      name: string
    }
    stats: {
      wins: { value: number }
      goals: { value: number }
      saves: { value: number }
      assists: { value: number }
      shots: { value: number }
      mvps: { value: number }
      rating?: { value: number }
      tier?: { value: number }
      division?: { value: number }
    }
  }[]
}

export interface RocketLeagueSnapshot {
  platformId: string
  platformUserHandle: string
  timestamp: number
  wins: number
  goals: number
  saves: number
  assists: number
  mvps: number
  rating: number
}

async function rocketLeagueApiRequest(endpoint: string) {
  const response = await fetch(`${ROCKET_LEAGUE_API_BASE}${endpoint}`, {
    headers: {
      'TRN-Api-Key': API_KEY
    }
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Player not found')
    }
    throw new Error(`API request failed: ${response.status}`)
  }

  return await response.json()
}

export async function searchRocketLeaguePlayer(
  playerName: string,
  platform: string = 'steam'
): Promise<RocketLeaguePlayer | null> {
  try {
    const data = await rocketLeagueApiRequest(`/standard/profile/${platform}/${encodeURIComponent(playerName)}`)
    
    if (!data || !data.data) {
      return null
    }

    const profile = data.data
    
    return {
      platformId: profile.platformInfo.platformUserId,
      platformSlug: profile.platformInfo.platformSlug,
      platformUserIdentifier: profile.platformInfo.platformUserIdentifier,
      platformUserHandle: profile.platformInfo.platformUserHandle,
      avatarUrl: profile.platformInfo.avatarUrl
    }
  } catch (error) {
    console.error('Error searching Rocket League player:', error)
    return null
  }
}

export async function getRocketLeaguePlayer(
  playerName: string,
  platform: string = 'steam'
): Promise<RocketLeaguePlayer | null> {
  try {
    const data = await rocketLeagueApiRequest(`/standard/profile/${platform}/${encodeURIComponent(playerName)}`)
    
    if (!data || !data.data) {
      return null
    }

    const profile = data.data

    return {
      platformId: profile.platformInfo.platformUserId,
      platformSlug: profile.platformInfo.platformSlug,
      platformUserIdentifier: profile.platformInfo.platformUserIdentifier,
      platformUserHandle: profile.platformInfo.platformUserHandle,
      avatarUrl: profile.platformInfo.avatarUrl
    }
  } catch (error) {
    console.error('Error fetching Rocket League player:', error)
    return null
  }
}

export async function getRocketLeagueStats(
  playerName: string,
  platform: string = 'steam'
): Promise<RocketLeagueStats | null> {
  try {
    const data = await rocketLeagueApiRequest(`/standard/profile/${platform}/${encodeURIComponent(playerName)}`)
    
    if (!data || !data.data || !data.data.segments) {
      return null
    }

    return {
      platformId: data.data.platformInfo.platformUserId,
      platformUserHandle: data.data.platformInfo.platformUserHandle,
      segments: data.data.segments.map((segment: any) => ({
        type: segment.type,
        metadata: {
          name: segment.metadata?.name || 'Unknown'
        },
        stats: {
          wins: { value: segment.stats?.wins?.value || 0 },
          goals: { value: segment.stats?.goals?.value || 0 },
          saves: { value: segment.stats?.saves?.value || 0 },
          assists: { value: segment.stats?.assists?.value || 0 },
          shots: { value: segment.stats?.shots?.value || 0 },
          mvps: { value: segment.stats?.mVPs?.value || 0 },
          rating: { value: segment.stats?.rating?.value || 0 },
          tier: { value: segment.stats?.tier?.value || 0 },
          division: { value: segment.stats?.division?.value || 0 }
        }
      }))
    }
  } catch (error) {
    console.error('Error fetching Rocket League stats:', error)
    return null
  }
}

export async function captureRocketLeagueSnapshot(
  playerName: string,
  platform: string = 'steam'
): Promise<RocketLeagueSnapshot | null> {
  try {
    const stats = await getRocketLeagueStats(playerName, platform)
    
    if (!stats || !stats.segments || stats.segments.length === 0) {
      return null
    }

    const careerStats = stats.segments.find(s => s.type === 'overview') || stats.segments[0]

    return {
      platformId: stats.platformId,
      platformUserHandle: stats.platformUserHandle,
      timestamp: Date.now(),
      wins: careerStats.stats.wins.value,
      goals: careerStats.stats.goals.value,
      saves: careerStats.stats.saves.value,
      assists: careerStats.stats.assists.value,
      mvps: careerStats.stats.mvps.value,
      rating: careerStats.stats.rating?.value || 0
    }
  } catch (error) {
    console.error('Error capturing Rocket League snapshot:', error)
    return null
  }
}

export function compareRocketLeagueSnapshots(
  beforeSnapshot: RocketLeagueSnapshot,
  afterSnapshot: RocketLeagueSnapshot
): {
  winsGained: number
  goalsGained: number
  savesGained: number
  assistsGained: number
  mvpsGained: number
  ratingChange: number
  hasNewWin: boolean
  totalScoreGained: number
} {
  const winsGained = afterSnapshot.wins - beforeSnapshot.wins
  const goalsGained = afterSnapshot.goals - beforeSnapshot.goals
  const savesGained = afterSnapshot.saves - beforeSnapshot.saves
  const assistsGained = afterSnapshot.assists - beforeSnapshot.assists
  const mvpsGained = afterSnapshot.mvps - beforeSnapshot.mvps
  
  const totalScoreGained = (winsGained * 10) + goalsGained + savesGained + assistsGained + (mvpsGained * 5)

  return {
    winsGained,
    goalsGained,
    savesGained,
    assistsGained,
    mvpsGained,
    ratingChange: afterSnapshot.rating - beforeSnapshot.rating,
    hasNewWin: winsGained > 0,
    totalScoreGained
  }
}

export function determineRocketLeagueWinner(
  player1Before: RocketLeagueSnapshot,
  player1After: RocketLeagueSnapshot,
  player2Before: RocketLeagueSnapshot,
  player2After: RocketLeagueSnapshot
): 'CREATOR' | 'JOINER' | 'DRAW' | null {
  const p1Comparison = compareRocketLeagueSnapshots(player1Before, player1After)
  const p2Comparison = compareRocketLeagueSnapshots(player2Before, player2After)

  const p1PlayedMatch = p1Comparison.goalsGained > 0 || p1Comparison.savesGained > 0 || p1Comparison.winsGained > 0
  const p2PlayedMatch = p2Comparison.goalsGained > 0 || p2Comparison.savesGained > 0 || p2Comparison.winsGained > 0

  if (!p1PlayedMatch || !p2PlayedMatch) {
    return null // Not ready to determine
  }

  // Priority 1: Compare wins
  if (p1Comparison.winsGained > p2Comparison.winsGained) return 'CREATOR'
  if (p2Comparison.winsGained > p1Comparison.winsGained) return 'JOINER'

  // Priority 2: If same wins, compare MVPs
  if (p1Comparison.mvpsGained > p2Comparison.mvpsGained) return 'CREATOR'
  if (p2Comparison.mvpsGained > p1Comparison.mvpsGained) return 'JOINER'

  // Priority 3: Compare total score (goals + saves + assists)
  if (p1Comparison.totalScoreGained > p2Comparison.totalScoreGained) return 'CREATOR'
  if (p2Comparison.totalScoreGained > p1Comparison.totalScoreGained) return 'JOINER'

  // Priority 4: Compare goals as tiebreaker
  if (p1Comparison.goalsGained > p2Comparison.goalsGained) return 'CREATOR'
  if (p2Comparison.goalsGained > p1Comparison.goalsGained) return 'JOINER'
  
  return 'DRAW'
}

export function formatPlatform(platform: string): string {
  const platforms: Record<string, string> = {
    'steam': 'Steam',
    'psn': 'PlayStation',
    'xbl': 'Xbox',
    'epic': 'Epic Games',
    'switch': 'Nintendo Switch'
  }
  return platforms[platform] || platform
}

export function formatRank(tier: number): string {
  const ranks: Record<number, string> = {
    0: 'Unranked',
    1: 'Bronze I',
    2: 'Bronze II',
    3: 'Bronze III',
    4: 'Silver I',
    5: 'Silver II',
    6: 'Silver III',
    7: 'Gold I',
    8: 'Gold II',
    9: 'Gold III',
    10: 'Platinum I',
    11: 'Platinum II',
    12: 'Platinum III',
    13: 'Diamond I',
    14: 'Diamond II',
    15: 'Diamond III',
    16: 'Champion I',
    17: 'Champion II',
    18: 'Champion III',
    19: 'Grand Champion I',
    20: 'Grand Champion II',
    21: 'Grand Champion III',
    22: 'Supersonic Legend'
  }
  return ranks[tier] || 'Unknown'
}