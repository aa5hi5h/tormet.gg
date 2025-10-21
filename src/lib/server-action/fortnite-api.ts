const FORTNITE_API_BASE = 'https://api.fortnitetracker.com/v1'
const API_KEY = process.env.FORTNITE_TRACKER_API_KEY!

export interface FortnitePlayer {
  accountId: string
  epicUserHandle: string
  platformName: string
  platformNameLong: string
}

export interface FortniteStats {
  accountId: string
  epicUserHandle: string
  platformName: string
  stats: {
    wins: number
    kills: number
    kd: number
    matches: number
    top1: number
    top3: number
    top5: number
    top6: number
    top10: number
    top12: number
    top25: number
  }
}

export interface FortniteRecentMatch {
  id: string
  dateCollected: string
  playlist: string
  kills: number
  minutesPlayed: number
  playersOutlived: number
  top1: number
  top3: number
  top5: number
  top6: number
  top10: number
  top12: number
  top25: number
  score: number
}

export interface FortniteSnapshot {
  accountId: string
  epicUserHandle: string
  timestamp: number
  wins: number
  kills: number
  matches: number
  kd: number
}

async function fortniteApiRequest(endpoint: string) {
  const response = await fetch(`${FORTNITE_API_BASE}${endpoint}`, {
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

export async function searchFortnitePlayer(epicUsername: string): Promise<FortnitePlayer | null> {
  try {
    const platforms = ['pc', 'xbl', 'psn']
    
    for (const platform of platforms) {
      try {
        const data = await fortniteApiRequest(`/profile/${platform}/${encodeURIComponent(epicUsername)}`)
        
        if (data && data.accountId) {
          return {
            accountId: data.accountId,
            epicUserHandle: data.epicUserHandle,
            platformName: data.platformName,
            platformNameLong: data.platformNameLong
          }
        }
      } catch (err) {
        continue
      }
    }
    
    return null
  } catch (error) {
    console.error('Error searching Fortnite player:', error)
    return null
  }
}

export async function getFortnitePlayer(
  epicUsername: string,
  platform: string = 'pc'
): Promise<FortnitePlayer | null> {
  try {
    const data = await fortniteApiRequest(`/profile/${platform}/${encodeURIComponent(epicUsername)}`)
    
    if (!data || !data.accountId) {
      return null
    }

    return {
      accountId: data.accountId,
      epicUserHandle: data.epicUserHandle,
      platformName: data.platformName,
      platformNameLong: data.platformNameLong
    }
  } catch (error) {
    console.error('Error fetching Fortnite player:', error)
    return null
  }
}

export async function getFortniteStats(
  epicUsername: string,
  platform: string = 'pc'
): Promise<FortniteStats | null> {
  try {
    const data = await fortniteApiRequest(`/profile/${platform}/${encodeURIComponent(epicUsername)}`)
    
    if (!data || !data.stats) {
      return null
    }

    const lifetimeStats = data.lifeTimeStats || []
    const getStatValue = (key: string) => {
      const stat = lifetimeStats.find((s: any) => s.key === key)
      return stat ? parseInt(stat.value.replace(/,/g, '')) : 0
    }

    return {
      accountId: data.accountId,
      epicUserHandle: data.epicUserHandle,
      platformName: data.platformName,
      stats: {
        wins: getStatValue('Top 1'),
        kills: getStatValue('Kills'),
        kd: parseFloat(lifetimeStats.find((s: any) => s.key === 'K/d')?.value || '0'),
        matches: getStatValue('Matches Played'),
        top1: getStatValue('Top 1'),
        top3: getStatValue('Top 3s'),
        top5: getStatValue('Top 5s'),
        top6: getStatValue('Top 6s'),
        top10: getStatValue('Top 10'),
        top12: getStatValue('Top 12s'),
        top25: getStatValue('Top 25s')
      }
    }
  } catch (error) {
    console.error('Error fetching Fortnite stats:', error)
    return null
  }
}

export async function getRecentFortniteMatches(
  epicUsername: string,
  platform: string = 'pc'
): Promise<FortniteRecentMatch[]> {
  try {
    const data = await fortniteApiRequest(`/profile/${platform}/${encodeURIComponent(epicUsername)}/matches`)
    
    if (!data || !Array.isArray(data)) {
      return []
    }

    return data.slice(0, 20).map((match: any) => ({
      id: match.id || `${match.dateCollected}-${match.playlist}`,
      dateCollected: match.dateCollected,
      playlist: match.playlist,
      kills: match.kills || 0,
      minutesPlayed: match.minutesPlayed || 0,
      playersOutlived: match.playersOutlived || 0,
      top1: match.top1 || 0,
      top3: match.top3 || 0,
      top5: match.top5 || 0,
      top6: match.top6 || 0,
      top10: match.top10 || 0,
      top12: match.top12 || 0,
      top25: match.top25 || 0,
      score: match.score || 0
    }))
  } catch (error) {
    console.error('Error fetching recent Fortnite matches:', error)
    return []
  }
}

export async function captureFortniteSnapshot(
  epicUsername: string,
  platform: string = 'pc'
): Promise<FortniteSnapshot | null> {
  try {
    const stats = await getFortniteStats(epicUsername, platform)
    
    if (!stats) {
      return null
    }

    return {
      accountId: stats.accountId,
      epicUserHandle: stats.epicUserHandle,
      timestamp: Date.now(),
      wins: stats.stats.wins,
      kills: stats.stats.kills,
      matches: stats.stats.matches,
      kd: stats.stats.kd
    }
  } catch (error) {
    console.error('Error capturing Fortnite snapshot:', error)
    return null
  }
}

export function compareFortniteSnapshots(
  beforeSnapshot: FortniteSnapshot,
  afterSnapshot: FortniteSnapshot
): {
  winsGained: number
  killsGained: number
  matchesPlayed: number
  hasNewWin: boolean
} {
  return {
    winsGained: afterSnapshot.wins - beforeSnapshot.wins,
    killsGained: afterSnapshot.kills - beforeSnapshot.kills,
    matchesPlayed: afterSnapshot.matches - beforeSnapshot.matches,
    hasNewWin: afterSnapshot.wins > beforeSnapshot.wins
  }
}

export function determineFortniteWinner(
  player1Before: FortniteSnapshot,
  player1After: FortniteSnapshot,
  player2Before: FortniteSnapshot,
  player2After: FortniteSnapshot
): 'CREATOR' | 'JOINER' | 'DRAW' | null {
  const p1Comparison = compareFortniteSnapshots(player1Before, player1After)
  const p2Comparison = compareFortniteSnapshots(player2Before, player2After)


  if (p1Comparison.matchesPlayed === 0 || p2Comparison.matchesPlayed === 0) {
    return null 
  }


  const p1Won = p1Comparison.hasNewWin
  const p2Won = p2Comparison.hasNewWin

  if (p1Won && !p2Won) return 'CREATOR'
  if (p2Won && !p1Won) return 'JOINER'
  if (p1Won && p2Won) return 'DRAW' 
  
  if (p1Comparison.killsGained > p2Comparison.killsGained) return 'CREATOR'
  if (p2Comparison.killsGained > p1Comparison.killsGained) return 'JOINER'
  
  return 'DRAW'
}

export function formatPlatform(platform: string): string {
  const platforms: Record<string, string> = {
    'pc': 'PC',
    'xbl': 'Xbox',
    'psn': 'PlayStation',
    'switch': 'Nintendo Switch'
  }
  return platforms[platform] || platform
}