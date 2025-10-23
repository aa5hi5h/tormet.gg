const PUBG_API_BASE = 'https://api.pubg.com/shards'
const API_KEY = process.env.PUBG_API_KEY || '' 

export type PUBGPlatform = 
  | 'steam'
  | 'kakao' 
  | 'psn' 
  | 'xbox' 
  | 'stadia' 

export interface PUBGPlayer {
  type: string
  id: string
  attributes: {
    name: string
    shardId: string
    createdAt: string
    updatedAt: string
    patchVersion: string
    banType: string
    clanId: string
    stats: any
  }
  relationships: {
    matches: {
      data: Array<{
        type: string
        id: string
      }>
    }
  }
}

export interface PUBGMatch {
  type: string
  id: string
  attributes: {
    gameMode: string
    duration: number
    mapName: string
    createdAt: string
    shardId: string
    matchType: string
    seasonState: string
    isCustomMatch: boolean
  }
  relationships: {
    rosters: {
      data: Array<{
        type: string
        id: string
      }>
    }
  }
  included?: Array<PUBGRoster | PUBGParticipant>
}

export interface PUBGRoster {
  type: 'roster'
  id: string
  attributes: {
    won: string // "true" or "false"
    shardId: string
    stats: {
      rank: number
      teamId: number
    }
  }
  relationships: {
    participants: {
      data: Array<{
        type: string
        id: string
      }>
    }
    team: {
      data: any
    }
  }
}

export interface PUBGParticipant {
  type: 'participant'
  id: string
  attributes: {
    shardId: string
    stats: {
      playerId: string
      name: string
      kills: number
      assists: number
      DBNOs: number
      deathType: string
      headshotKills: number
      damageDealt: number
      timeSurvived: number
      winPlace: number
      rankPoints?: number
    }
  }
}

export interface PUBGPlayerStats {
  kills: number
  deaths: number
  assists: number
  wins: number
  top10s: number
  damageDealt: number
  headshotKills: number
  longestKill: number
  matchesPlayed: number
  timeSurvived: number
  rankPoints?: number
}

async function pubgApiRequest(platform: PUBGPlatform, endpoint: string){
    const response = await fetch(`${PUBG_API_BASE}/${platform}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/vnd.api+json'
    }
  })

  if(!response.ok){
    if(response.status === 404){
        throw new Error('Player or match not found')
    }
    if(response.status === 401){
        throw new Error('Invalid Api key ')
    }
    if(response.status === 429){
        throw new Error('Rate limit exceeded')
    }
    throw new Error(`API request failed: ${response.status}`)
  }

  return await response.json()
}

export async function getPlayerByName(
  playerName: string, 
  platform: PUBGPlatform = 'steam'
): Promise<PUBGPlayer | null> {
  try {
    const data = await pubgApiRequest(platform, `/players?filter[playerNames]=${encodeURIComponent(playerName)}`)
    
    if (!data.data || data.data.length === 0) {
      return null
    }

    return data.data[0]
  } catch (error) {
    console.error('Error fetching PUBG player:', error)
    return null
  }
}

export async function getPlayerById(
    playerId: string,
    platform: PUBGPlatform = "steam"
): Promise<PUBGPlayer | null>{
    try {
    const data = await pubgApiRequest(platform, `/players/${playerId}`)
    
    if (!data.data) {
      return null
    }

    return data.data
  } catch (error) {
    console.error('Error fetching PUBG player by ID:', error)
    return null
  }
}

export async function getRecentMatches(
  playerId: string,
  platform: PUBGPlatform = 'steam',
  limit: number = 5
): Promise<string[]> {
  try {
    const player = await getPlayerById(playerId, platform)
    
    if (!player || !player.relationships.matches.data) {
      return []
    }

    return player.relationships.matches.data
      .slice(0, limit)
      .map(match => match.id)
  } catch (error) {
    console.error('Error fetching recent matches:', error)
    return []
  }
}

export async function getMatchDetails(
  matchId: string,
  platform: PUBGPlatform = 'steam'
): Promise<PUBGMatch | null> {
  try {
    const data = await pubgApiRequest(platform, `/matches/${matchId}`)
    
    if (!data.data) {
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching match details:', error)
    return null
  }
}

export async function capturePlayerStatsSnapshot(
    playerId: string,
    platform: PUBGPlatform = "steam"
):Promise<PUBGPlayerStats | null>{
    try{
        const matchIds = await getRecentMatches(playerId,platform,10)

        if(matchIds.length === 0){
            return null
        }

        let totalKills = 0
        let totalDeaths = 0
        let totalAssists = 0
        let totalWins = 0
        let totalTop10s = 0
        let totalDamage = 0
        let totalHeadshotKills = 0
        let totalTimeSurvived = 0
        let matchesProcessed = 0

        for (const matchId of matchIds) {
      try {
        const matchData = await getMatchDetails(matchId, platform)
        
        if (!matchData || !matchData.included) continue

        const participants = matchData.included.filter(
          (item): item is PUBGParticipant => item.type === 'participant'
        )

        const playerParticipant = participants.find(
          p => p.attributes.stats.playerId === playerId
        )

        if (!playerParticipant) continue

        const stats = playerParticipant.attributes.stats
        totalKills += stats.kills || 0
        totalAssists += stats.assists || 0
        totalDamage += stats.damageDealt || 0
        totalHeadshotKills += stats.headshotKills || 0
        totalTimeSurvived += stats.timeSurvived || 0

        // Check if won
        if (stats.winPlace === 1) {
          totalWins++
        }

        // Check if top 10
        if (stats.winPlace <= 10) {
          totalTop10s++
        }

        // Deaths (if deathType is not alive)
        if (stats.deathType !== 'alive') {
          totalDeaths++
        }

        matchesProcessed++
      } catch (matchError) {
        console.error(`Error processing match ${matchId}:`, matchError)
        continue
      }
    }

    if (matchesProcessed === 0) {
      return null
    }

    return {
      kills: totalKills,
      deaths: totalDeaths,
      assists: totalAssists,
      wins: totalWins,
      top10s: totalTop10s,
      damageDealt: totalDamage,
      headshotKills: totalHeadshotKills,
      longestKill: 0, // Would need additional processing
      matchesPlayed: matchesProcessed,
      timeSurvived: totalTimeSurvived
    }
  }catch(err){
    console.error("Error Capturing player snapshot:::",err)
    return null
    }
}

export function comparePUBGSnapshots(
  before1: PUBGPlayerStats,
  after1: PUBGPlayerStats,
  before2: PUBGPlayerStats,
  after2: PUBGPlayerStats
): 'CREATOR' | 'JOINER' | 'DRAW' | null {

    const player1Wins = (after1.wins || 0) - (before1.wins || 0)
    const player2Wins = (after2.wins || 0) - (before2.wins || 0)

    if(player1Wins > player2Wins) return "CREATOR"
    if(player2Wins > player1Wins) return "JOINER"

    const player1kills = (after1.kills || 0 ) - (before1.kills || 0)
    const player2Kills = (after2.kills || 0 ) - (before2.kills || 0)

    if(player1kills > player2Kills) return "CREATOR"
    if(player2Kills > player1kills) return "JOINER"

    const player1Damage = (after1.damageDealt || 0) - (before1.damageDealt || 0)
    const player2Damage = (after2.damageDealt || 0) - (before2.damageDealt || 0)

    if( player1Damage > player2Damage) return "CREATOR"
    if(player2Damage > player1Damage) return "JOINER"

    if(player1Wins === 0 && player2Wins === 0 && 
        player1kills === 0 && player2Kills === 0 
    ){
        return null
    }

    return "DRAW"
}

export function formatPlatformName(platform: PUBGPlatform): string {
  const names: Record<PUBGPlatform, string> = {
    steam: 'PC (Steam)',
    kakao: 'PC (Kakao)',
    psn: 'PlayStation',
    xbox: 'Xbox',
    stadia: 'Stadia'
  }
  return names[platform] || platform
}


export async function validatePUBGPlayer(
  playerName: string,
  platform: PUBGPlatform = 'steam'
): Promise<{ valid: boolean; playerId?: string; error?: string }> {
  try {
    const player = await getPlayerByName(playerName, platform)
    
    if (!player) {
      return {
        valid: false,
        error: 'Player not found. Check spelling and platform.'
      }
    }

    return {
      valid: true,
      playerId: player.id
    }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Failed to validate player'
    }
  }
}