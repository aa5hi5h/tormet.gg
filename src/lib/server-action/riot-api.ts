const RIOT_API_KEY = process.env.RIOT_API_KEY!
 
export const REGIONS = {
  'NA': 'na1',
  'EUW': 'euw1',
  'EUNE': 'eun1',
  'KR': 'kr',
  'BR': 'br1',
  'LAN': 'la1',
  'LAS': 'la2',
  'OCE': 'oc1',
  'TR': 'tr1',
  'RU': 'ru',
  'JP': 'jp1',
  'PH': 'ph2',
  'SG': 'sg2',
  'TH': 'th2',
  'TW': 'tw2',
  'VN': 'vn2',
}

export const REGIONAL_ROUTING = {
  'na1': 'americas',
  'br1': 'americas',
  'la1': 'americas',
  'la2': 'americas',
  'euw1': 'europe',
  'eun1': 'europe',
  'tr1': 'europe',
  'ru': 'europe',
  'kr': 'asia',
  'jp1': 'asia',
  'oc1': 'sea',
  'ph2': 'sea',
  'sg2': 'sea',
  'th2': 'sea',
  'tw2': 'sea',
  'vn2': 'sea',
}

interface SummonerData {
  id: string
  accountId: string
  puuid: string
  name: string
  profileIconId: number
  summonerLevel: number
}

interface MatchData {
  metadata: {
    matchId: string
    participants: string[] 
  }
  info: {
    gameCreation: number
    gameDuration: number
    gameEndTimestamp: number
    participants: ParticipantData[]
  }
}

interface ParticipantData {
  puuid: string
  summonerName: string
  championName: string
  win: boolean
  kills: number
  deaths: number
  assists: number
}

export async function getSummonerByName(summonerName: string, region: string): Promise<SummonerData | null> {
  try {
    const response = await fetch(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY
        }
      }
    )

    if (!response.ok) {
      console.error('Summoner not found:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching summoner:', error)
    return null
  }
}

export async function getRecentMatches(puuid: string, region: string, count: number = 5): Promise<string[]> {
  try {
    const regionalRoute = REGIONAL_ROUTING[region as keyof typeof REGIONAL_ROUTING]
    
    const response = await fetch(
      `https://${regionalRoute}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY
        }
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch matches:', response.status)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching recent matches:', error)
    return []
  }
}

export async function getMatchDetails(matchId: string, region: string): Promise<MatchData | null> {
  try {
    const regionalRoute = REGIONAL_ROUTING[region as keyof typeof REGIONAL_ROUTING]
    
    const response = await fetch(
      `https://${regionalRoute}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY
        }
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch match details:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching match details:', error)
    return null
  }
}

export async function findMatchBetweenPlayers(
  puuid1: string,
  puuid2: string,
  region: string,
  afterTimestamp?: number
): Promise<MatchData | null> {
  try {
    const matchIds = await getRecentMatches(puuid1, region, 20)
    
    for (const matchId of matchIds) {
      const matchData = await getMatchDetails(matchId, region)
      
      if (!matchData) continue
      
      if (afterTimestamp && matchData.info.gameCreation < afterTimestamp) {
        continue
      }
      
      const participants = matchData.metadata.participants
      if (participants.includes(puuid1) && participants.includes(puuid2)) {
        return matchData
      }
    }
    
    return null
  } catch (error) {
    console.error('Error finding match between players:', error)
    return null
  }
}

export function determineWinner(matchData: MatchData, puuid1: string, puuid2: string): 'CREATOR' | 'JOINER' | 'DRAW' {
  const participant1 = matchData.info.participants.find(p => p.puuid === puuid1)
  const participant2 = matchData.info.participants.find(p => p.puuid === puuid2)
  
  if (!participant1 || !participant2) {
    throw new Error('Players not found in match data')
  }
  
  if (participant1.win === participant2.win) {
    return 'DRAW'
  }
  

  return participant1.win ? 'CREATOR' : 'JOINER'
}