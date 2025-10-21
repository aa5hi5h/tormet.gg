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

interface ValorantAccountData{
  puuid: string,
  gameName: string,
  tagLine: string
}

interface ValorantMatchData {
  matchInfo: {
    matchId: string
    mapId: string
    gameStartMillis: number
  }
  players: ValorantPlayer[]
}

interface ValorantPlayer {
  puuid: string
  gameName: string
  tagLine: string
  teamId: string
  won: boolean
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

export async function getValorantAccount(gameName:string, tagLine: string, region: string): Promise<ValorantAccountData | null>{

  try{
    const response = await fetch(
      `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY
        }
      }
    )

    if(!response.ok){
      console.error("Valorant account data not found:::", response.status)
      return null
    }

    return await response.json()

  }catch(err){
    console.log("Error fetching error account::::",err)
    return null
  }
}

export async function getRecentValorantMatches(puuid: string, region: string, count: number = 5): Promise<string[]> {
  try {
    const regionalRoute = REGIONAL_ROUTING[region as keyof typeof REGIONAL_ROUTING]
    
    const response = await fetch(
      `https://${regionalRoute}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}?size=${count}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY
        }
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch Valorant matches:', response.status)
      return []
    }

    const data = await response.json()
    return data.history?.map((match: any) => match.matchId) || []
  } catch (error) {
    console.error('Error fetching Valorant matches:', error)
    return []
  }
}

export async function getValorantMatchDetails(matchId: string, region: string): Promise<ValorantMatchData | null> {
  try {
    const regionalRoute = REGIONAL_ROUTING[region as keyof typeof REGIONAL_ROUTING]
    
    const response = await fetch(
      `https://${regionalRoute}.api.riotgames.com/val/match/v1/matches/${matchId}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY
        }
      }
    )

    if (!response.ok) {
      console.error('Failed to fetch Valorant match details:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching Valorant match details:', error)
    return null
  }
}

export async function findValorantMatchBetweenPlayers(
  puuid1: string,
  puuid2: string,
  region: string,
  afterTimestamp?: number 
): Promise<ValorantMatchData | null>{
  try{

    const matchIds = await getRecentValorantMatches(puuid1, region, 20)

    for ( const matchId of matchIds){
      const matchData = await getValorantMatchDetails(matchId,region)

      if(!matchData) continue

      if(afterTimestamp && matchData.matchInfo.gameStartMillis < afterTimestamp) {
        continue
      }

      const player1 = matchData.players.find(p => p.puuid === puuid1)
      const player2 = matchData.players.find(p => p.puuid === puuid2)

      if(player1 && player2){
        return matchData
      }
    }

    return null

  }catch(err){
    console.log("Error finding the valorant match between player :::",err)
    return null
  }
}

export function determineValorantWinner(matchData: ValorantMatchData, puuid1: string, puuid2: string): 'CREATOR' | 'JOINER' | 'DRAW' {
  const player1 = matchData.players.find(p => p.puuid === puuid1)
  const player2 = matchData.players.find(p => p.puuid === puuid2)
  
  if (!player1 || !player2) {
    throw new Error('Players not found in match data')
  }
  
  if (player1.teamId === player2.teamId) {
    return 'DRAW'
  }

  return player1.won ? 'CREATOR' : 'JOINER'
}