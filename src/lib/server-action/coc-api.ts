const COC_API_BASE = 'https://api.clashofclans.com/v1'
const API_KEY = process.env.CLASH_OF_CLANS_API_KEY || '' // Set this in your .env

export interface CocClan {
  tag: string
  name: string
  type: string
  description?: string
  location?: {
    name: string
    isCountry: boolean
  }
  badgeUrls: {
    small: string
    medium: string
    large: string
  }
  clanLevel: number
  clanPoints: number
  clanVersusPoints: number
  requiredTrophies: number
  warFrequency: string
  warWinStreak: number
  warWins: number
  warTies?: number
  warLosses?: number
  isWarLogPublic: boolean
  warLeague?: {
    name: string
  }
  members: number
  labels: Array<{
    name: string
    iconUrls: {
      small: string
      medium: string
    }
  }>
}

export interface CocWarInfo {
  state: 'notInWar' | 'preparation' | 'inWar' | 'warEnded'
  teamSize: number
  preparationStartTime?: string
  startTime?: string
  endTime?: string
  clan: {
    tag: string
    name: string
    badgeUrls: {
      small: string
      medium: string
      large: string
    }
    clanLevel: number
    attacks: number
    stars: number
    destructionPercentage: number
    members: Array<{
      tag: string
      name: string
      mapPosition: number
      townhallLevel: number
      opponentAttacks: number
      bestOpponentAttack?: {
        attackerTag: string
        defenderTag: string
        stars: number
        destructionPercentage: number
      }
      attacks?: Array<{
        attackerTag: string
        defenderTag: string
        stars: number
        destructionPercentage: number
        order: number
      }>
    }>
  }
  opponent: {
    tag: string
    name: string
    badgeUrls: {
      small: string
      medium: string
      large: string
    }
    clanLevel: number
    attacks: number
    stars: number
    destructionPercentage: number
    members: Array<{
      tag: string
      name: string
      mapPosition: number
      townhallLevel: number
      opponentAttacks: number
      bestOpponentAttack?: {
        attackerTag: string
        defenderTag: string
        stars: number
        destructionPercentage: number
      }
      attacks?: Array<{
        attackerTag: string
        defenderTag: string
        stars: number
        destructionPercentage: number
        order: number
      }>
    }>
  }
}

async function cocApiRequest(endpoint: string) {
  // Encode clan tags properly (replace # with %23)
  const encodedEndpoint = endpoint.replace(/#/g, '%23')
  
  const response = await fetch(`${COC_API_BASE}${encodedEndpoint}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Clan not found or war log is private')
    }
    if (response.status === 403) {
      throw new Error('Invalid API key or IP not whitelisted')
    }
    throw new Error(`API request failed: ${response.status}`)
  }

  return await response.json()
}

export async function getClan(clanTag: string): Promise<CocClan | null> {
  try {
    // Ensure clan tag starts with #
    const formattedTag = clanTag.startsWith('#') ? clanTag : `#${clanTag}`
    
    const data = await cocApiRequest(`/clans/${formattedTag}`)
    
    if (!data) {
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching CoC clan:', error)
    return null
  }
}

export async function getCurrentWar(clanTag: string): Promise<CocWarInfo | null> {
  try {
    const formattedTag = clanTag.startsWith('#') ? clanTag : `#${clanTag}`
    
    const data = await cocApiRequest(`/clans/${formattedTag}/currentwar`)
    
    if (!data || data.state === 'notInWar') {
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching current war:', error)
    return null
  }
}


export async function getWarLog(clanTag: string): Promise<CocWarInfo[]> {
  try {
    const formattedTag = clanTag.startsWith('#') ? clanTag : `#${clanTag}`
    
    const data = await cocApiRequest(`/clans/${formattedTag}/warlog`)
    
    if (!data || !data.items) {
      return []
    }

    return data.items
  } catch (error) {
    console.error('Error fetching war log:', error)
    return []
  }
}

export async function findWarBetweenClans(
  clanTag1: string,
  clanTag2: string,
  afterTimestamp?: number
): Promise<CocWarInfo | null> {
  try {
    const currentWar = await getCurrentWar(clanTag1)
    
    if (currentWar && currentWar.opponent.tag === clanTag2) {
      if (afterTimestamp && currentWar.startTime) {
        const warStartTime = new Date(currentWar.startTime).getTime()
        if (warStartTime < afterTimestamp) {
          return null 
        }
      }
      return currentWar
    }

    const warLog = await getWarLog(clanTag1)
    
    for (const war of warLog) {
      if (war.opponent.tag === clanTag2) {
        if (afterTimestamp && war.endTime) {
          const warEndTime = new Date(war.endTime).getTime()
          if (warEndTime < afterTimestamp) {
            continue // War ended before match was created
          }
        }
        return war
      }
    }

    return null
  } catch (error) {
    console.error('Error finding war between clans:', error)
    return null
  }
}

export function determineClanWarWinner(
  war: CocWarInfo,
  clanTag1: string,
  clanTag2: string
): 'CREATOR' | 'JOINER' | 'DRAW' | null {
  if (war.state !== 'warEnded') {
    return null 
  }

  const clan1IsClan = war.clan.tag === clanTag1
  const clan1Stars = clan1IsClan ? war.clan.stars : war.opponent.stars
  const clan2Stars = clan1IsClan ? war.opponent.stars : war.clan.stars
  const clan1Destruction = clan1IsClan ? war.clan.destructionPercentage : war.opponent.destructionPercentage
  const clan2Destruction = clan1IsClan ? war.opponent.destructionPercentage : war.clan.destructionPercentage

  // Compare stars first
  if (clan1Stars > clan2Stars) return 'CREATOR'
  if (clan2Stars > clan1Stars) return 'JOINER'

  // If stars are equal, compare destruction percentage
  if (clan1Destruction > clan2Destruction) return 'CREATOR'
  if (clan2Destruction > clan1Destruction) return 'JOINER'

  // Perfect tie
  return 'DRAW'
}

export function getWarState(war: CocWarInfo): string {
  const states: Record<string, string> = {
    'preparation': 'Preparation Day',
    'inWar': 'Battle Day',
    'warEnded': 'War Ended',
    'notInWar': 'Not in War'
  }
  return states[war.state] || war.state
}

export function getTimeRemaining(war: CocWarInfo): string {
  if (!war.endTime) return 'Unknown'
  
  const now = Date.now()
  const endTime = new Date(war.endTime).getTime()
  const remaining = endTime - now

  if (remaining <= 0) return 'War Ended'

  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours}h ${minutes}m remaining`
}

export function formatClanTag(tag: string): string {
  return tag.startsWith('#') ? tag : `#${tag}`
}