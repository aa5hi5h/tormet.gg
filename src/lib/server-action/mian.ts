'use server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import { determineValorantWinner, determineWinner, findMatchBetweenPlayers, findValorantMatchBetweenPlayers, getSummonerByName, getValorantAccount } from './riot-api'
import { determineDotaWinner, findDotaMatchBetweenPlayers, getDotaPlayer } from './dota-api'
import { captureCSGOStatsSnapshot, compareCSGOSnapshots, CSGOMatchSnapshot, getSteamPlayer, isValidSteamId, resolveSteamVanityURL } from './steam-api'
import { captureFortniteSnapshot, determineFortniteWinner, FortniteSnapshot, getFortnitePlayer } from './fortnite-api'
import { captureRocketLeagueSnapshot, determineRocketLeagueWinner, getRocketLeaguePlayer, RocketLeagueSnapshot } from './rocket-league-api'

export async function createMatch(username: string, gameId: string, url: string) {
  let user = await prisma.user.findUnique({
    where: { username }
  })
  
  if (!user) {
    user = await prisma.user.create({
      data: { username }
    })
  }
  

  const match = await prisma.match.create({
    data: {
      gameId,
      url,
      creatorId: user.id,
      status: 'WAITING'
    },
    include: {
      creator: true
    }
  })
  
  return match
}

export async function joinMatch(matchId: string, username: string) {
  let user = await prisma.user.findUnique({
    where: { username }
  })
  
  if (!user) {
    user = await prisma.user.create({
      data: { username }
    })
  }
  
  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      joinerId: user.id,
      status: 'PLAYING'
    },
    include: {
      creator: true,
      joiner: true
    }
  })
  
  return match
}

export async function getOpenMatches() {
  return await prisma.match.findMany({
    where: {
      status: 'WAITING'
    },
    include: {
      creator: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function checkAndUpdateGameResults() {
  const playingMatches = await prisma.match.findMany({
    where: { status: 'PLAYING' }
  })
  
  for (const match of playingMatches) {
    try {
      const response = await axios.get(`https://lichess.org/api/game/${match.gameId}`)
      const game = response.data
      
      if (game.status === 'mate' || game.status === 'resign' || game.status === 'outoftime') {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: 'FINISHED',
            winner: game.winner?.toUpperCase() || 'DRAW',
            finishedAt: new Date()
          }
        })
      }
    } catch (error) {
      console.error('Error checking game:', error)
    }
  }
}


export async function getAllActiveMatches(){
    return await prisma.match.findMany({
        where:{
            status: {
                in: ['WAITING','PLAYING',"FINISHED"]
            }
  },
  include:{
    creator: true,
    joiner: true
  },
  orderBy: {
    createdAt: 'desc'
  }
    })
}

export async function CreateLOLMatch(
    username:string,
    summonerName: string,
    region: string
){
    try{
        const SummonerData = await getSummonerByName(summonerName,region)

        if(!SummonerData){
            throw new Error("summoner not found")
        }

        let user = await prisma.user.findUnique({
            where: {username}
        })

        if(!user){
          user = await prisma.user.create({
            data:{
              username
            }
          })
        }

        const match = await prisma.match.create({
      data: {
        gameType: "LOL",
        creatorId: user.id,
        summonerName1: SummonerData.name,
        summonerPuuid1: SummonerData.puuid,
        region: region,
        status: 'WAITING'
      },
      include: {
        creator: true
      }
    })

    return match

    }catch(error){
      console.error("Error creating the match")
      throw error
    }
}

export async function joinLoLMatch(matchId: string, username: string, summonerName: string) {
  try{

    const match = await prisma.match.findUnique({
      where: {id: matchId}
    })

    if(!match || match.gameType !== "LOL"){
      throw new Error("Match not found!!!")
    }

    const SummonerData = await getSummonerByName(summonerName, match.region!)

    if(!SummonerData){
      throw new Error ("Summoner not found")
    }

    let user = await prisma.user.findUnique({
      where:{username}
    })

    if(!user){
      user = await prisma.user.create({
        data: {username}
      })
    }

    const updatedMatch = await prisma.match.update({
      where: {id: matchId},
      data: {
        joinerId: user.id,
        summonerName2: SummonerData.name,
        summonerPuuid2: SummonerData.puuid,
        status: 'PLAYING'
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    return updatedMatch
  }catch(err){
    console.error("there was a error while joinig match",err)
    throw err
  }
}

export async function getOpenLOLMatches(){
  return await prisma.match.findMany({
    where:{
      gameType: "LOL",
      status: "WAITING"
    },
    include: {
      creator: true
    },
    orderBy: {
      createdAt : 'desc'
    }
  })
}


export async function getAllLOLMatches(){
  return await prisma.match.findMany({
    where:{
      gameType :"LOL"
    },
    include: {
      creator: true,
      joiner: true
    },
    orderBy :{
      createdAt: "desc"
    }
  })
}

export async function getLOLMatchById(matchId: string){
  return await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      creator: true,
      joiner: true
    }
  })
}

export async function CheckLOLMatchResult() {
  try {
    const playingMatches = await prisma.match.findMany({
      where: {
        gameType: "LOL",
        status: "PLAYING"
      }
    })

    for (const match of playingMatches) {
      if (!match.summonerPuuid1 || !match.summonerPuuid2 || !match.region) {
        continue
      }

      const riotMatch = await findMatchBetweenPlayers(
        match.summonerPuuid1,
        match.summonerPuuid2,
        match.region,
        match.createdAt.getTime()
      )

      if (riotMatch) {
        const winner = determineWinner(
          riotMatch,
          match.summonerPuuid1,
          match.summonerPuuid2
        )

        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: "FINISHED",
            winner: winner,
            riotMatchId: riotMatch?.metadata.matchId,
            finishedAt: new Date()
          }
        })

        console.log(`✅ LoL Match ${match.id} finished! Winner: ${winner}`)
      }
    }

  } catch (err) {
    console.error("Error checking LOL match results:", err)
    throw err
  }
}

export async function CreateValorantMatch(
  username: string,
  riotId: string,
  region: string
){
  try{

    const [gameName, tagLine] = riotId.split('#')

    if(!gameName || !tagLine) {
      throw new Error("Invalid Riot Id format")
    }

    const accountData = await getValorantAccount(gameName, tagLine , region)

    if(!accountData){
      throw new Error("Riot account not found. check your Riot ID and region!")
    }

    let user = await prisma.user.findUnique({
      where: { username}
    })

    if(!user){
      user = await prisma.user.create({
        data: {username}
      })
    }

    const match = await prisma.match.create({
      data: {
        gameType: "VALORANT",
        creatorId: user.id,
        summonerName1: `${accountData.gameName}#${accountData.tagLine}`,
        summonerPuuid1: accountData.puuid,
        region: region,
        status: 'WAITING'
      },
      include: {
        creator: true
      }
    })

    return match

  }catch(err){

    console.error("Error creating valorant matches:::",err)
    throw err
  }
}

export async function joinValorantMatch(matchId: string, username: string, riotId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match || match.gameType !== "VALORANT") {
      throw new Error("Match not found!")
    }

    if (match.status !== 'WAITING') {
      throw new Error("Match is no longer available")
    }

    // Split Riot ID
    const [gameName, tagLine] = riotId.split('#')
    
    if (!gameName || !tagLine) {
      throw new Error("Invalid Riot ID format. Use: PlayerName#TAG")
    }

    const accountData = await getValorantAccount(gameName, tagLine, match.region!)

    if (!accountData) {
      throw new Error("Riot account not found!")
    }

    let user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { username }
      })
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        joinerId: user.id,
        summonerName2: `${accountData.gameName}#${accountData.tagLine}`,
        summonerPuuid2: accountData.puuid,
        status: 'PLAYING'
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    return updatedMatch
  } catch (err) {
    console.error("Error joining Valorant match:", err)
    throw err
  }
}

export async function getOpenValorantMatches(){
  return await prisma.match.findMany({
    where:{
      gameType: "VALORANT",
      status: "WAITING"
    },
    include:{
      creator: true
    },
    orderBy: {
      createdAt: "desc"
    }
  })
}

export async function getAllValorantMatches(){
  return await prisma.match.findMany({
    where: {
      gameType: "VALORANT"
    },
    include: {
      creator: true,
      joiner: true
    },
    orderBy:{
      createdAt: "desc"
    }
  })
}

export async function getValorantMatchById(matchId: string){
  return await prisma.match.findUnique({
    where: {id: matchId},
    include: {
      joiner: true,
      creator: true
    },
  })
}

export async function CheckValorantMatchResult() {
  try {
    const playingMatches = await prisma.match.findMany({
      where: {
        gameType: "VALORANT",
        status: "PLAYING"
      }
    })

    for (const match of playingMatches) {
      if (!match.summonerPuuid1 || !match.summonerPuuid2 || !match.region) {
        continue
      }

      const valorantMatch = await findValorantMatchBetweenPlayers(
        match.summonerPuuid1,
        match.summonerPuuid2,
        match.region,
        match.createdAt.getTime()
      )

      if (valorantMatch) {
        const winner = determineValorantWinner(
          valorantMatch,
          match.summonerPuuid1,
          match.summonerPuuid2
        )

        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: "FINISHED",
            winner: winner,
            riotMatchId: valorantMatch.matchInfo.matchId,
            finishedAt: new Date()
          }
        })

        console.log(`✅ Valorant Match ${match.id} finished! Winner: ${winner}`)
      }
    }

  } catch (err) {
    console.error("Error checking Valorant match results:", err)
    throw err
  }
}

export async function CreateDota2Match(
  username: string,
  accountId: string,  
  playerName?: string 
) {
  try {
    const playerData = await getDotaPlayer(accountId)

    if (!playerData) {
      throw new Error("Dota 2 player not found. Check your Account ID!")
    }

    let user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { username }
      })
    }

    const match = await prisma.match.create({
      data: {
        gameType: "DOTA2",
        creatorId: user.id,
        summonerName1: playerName || playerData.personaname,
        summonerPuuid1: accountId, // Store account ID in puuid field
        status: 'WAITING'
      },
      include: {
        creator: true
      }
    })

    return match

  } catch (error) {
    console.error("Error creating Dota 2 match:", error)
    throw error
  }
}


export async function joinDota2Match(matchId: string, username: string, accountId: string, playerName?: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match || match.gameType !== "DOTA2") {
      throw new Error("Match not found!")
    }

    if (match.status !== 'WAITING') {
      throw new Error("Match is no longer available")
    }

    // Verify player exists
    const playerData = await getDotaPlayer(accountId)

    if (!playerData) {
      throw new Error("Dota 2 player not found. Check your Account ID!")
    }

    let user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { username }
      })
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        joinerId: user.id,
        summonerName2: playerName || playerData.personaname,
        summonerPuuid2: accountId,
        status: 'PLAYING'
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    return updatedMatch
  } catch (err) {
    console.error("Error joining Dota 2 match:", err)
    throw err
  }
}

export async function getOpenDota2Matches() {
  return await prisma.match.findMany({
    where: {
      gameType: 'DOTA2',
      status: 'WAITING'
    },
    include: {
      creator: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}


export async function getAllDota2Matches() {
  return await prisma.match.findMany({
    where: {
      gameType: 'DOTA2'
    },
    include: {
      creator: true,
      joiner: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}


export async function getDota2MatchById(matchId: string) {
  return await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      creator: true,
      joiner: true
    }
  })
}

export async function CheckDota2MatchResult() {
  try {
    const playingMatches = await prisma.match.findMany({
      where: {
        gameType: "DOTA2",
        status: "PLAYING"
      }
    })

    for (const match of playingMatches) {
      if (!match.summonerPuuid1 || !match.summonerPuuid2) {
        continue
      }

      const dotaMatch = await findDotaMatchBetweenPlayers(
        match.summonerPuuid1,
        match.summonerPuuid2,
        match.createdAt.getTime()
      )

      if (dotaMatch) {
        const winner = determineDotaWinner(
          dotaMatch,
          match.summonerPuuid1,
          match.summonerPuuid2
        )

        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: "FINISHED",
            winner: winner,
            riotMatchId: dotaMatch.match_id.toString(),
            finishedAt: new Date()
          }
        })

        console.log(`✅ Dota 2 Match ${match.id} finished! Winner: ${winner}`)
      }
    }

  } catch (err) {
    console.error("Error checking Dota 2 match results:", err)
    throw err
  }
}

export async function CreateCSGOMatch(
  username: string,
  steamId: string,
  playerName: string
){
  try{

    let finalSteamId = steamId
    if(!isValidSteamId(steamId)){
       const resolved = await resolveSteamVanityURL(steamId)
      if (!resolved) {
        throw new Error("Invalid Steam ID or profile URL. Use your 17-digit Steam ID or custom URL.")
      }
      finalSteamId = resolved
    }

    const playerData = await getSteamPlayer(finalSteamId)
     if (!playerData) {
      throw new Error("Steam player not found. Check your Steam ID!")
    }

    const statsSnapshot = await captureCSGOStatsSnapshot(finalSteamId)
    if (!statsSnapshot) {
      throw new Error("Could not fetch CS:GO stats. Make sure your profile is public and you own CS:GO!")
    }

    let user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { username }
      })
    }

    const match = await prisma.match.create({
      data: {
        gameType: "CSGO",
        creatorId: user.id,
        summonerName1: playerName || playerData.personaname,
        summonerPuuid1: finalSteamId,
        statsSnapshotBefore: statsSnapshot as any, 
        status: 'WAITING'
      },
      include: {
        creator: true
      }
    })

    return match
  }catch(err){
    console.error("Error creating cs go match ::::",err)
  }
}

export async function joinCSGOMatch(matchId: string, username: string, steamId: string, playerName?: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match || match.gameType !== "CSGO") {
      throw new Error("Match not found!")
    }

    if (match.status !== 'WAITING') {
      throw new Error("Match is no longer available")
    }

    // Resolve vanity URL if needed
    let finalSteamId = steamId
    if (!isValidSteamId(steamId)) {
      const resolved = await resolveSteamVanityURL(steamId)
      if (!resolved) {
        throw new Error("Invalid Steam ID or profile URL")
      }
      finalSteamId = resolved
    }

    // Verify player
    const playerData = await getSteamPlayer(finalSteamId)
    if (!playerData) {
      throw new Error("Steam player not found!")
    }

    // Capture stats snapshot for joiner
    const statsSnapshot = await captureCSGOStatsSnapshot(finalSteamId)
    if (!statsSnapshot) {
      throw new Error("Could not fetch CS:GO stats. Make sure your profile is public!")
    }

    let user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { username }
      })
    }

    const currentSnapshot = match.statsSnapshotBefore as any
    currentSnapshot.player2 = statsSnapshot

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        joinerId: user.id,
        summonerName2: playerName || playerData.personaname,
        summonerPuuid2: finalSteamId,
        statsSnapshotBefore: currentSnapshot,
        status: 'PLAYING'
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    return updatedMatch
  } catch (err) {
    console.error("Error joining CS:GO match:", err)
    throw err
  }
}

export async function getOpenCSGOMatches(){
  return await prisma.match.findMany({
    where:{
      gameType: "CSGO",
      status: "WAITING"
    },
    include: {
      creator: true
    },
    orderBy: {
      createdAt : "desc"
    }
  })
}

export async function getAllCSGOMatches(){
  return await prisma.match.findMany({
    where: {
      gameType: "CSGO"
    },
    include:{
      creator: true,
      joiner: true
    },
    orderBy: {
      createdAt: "desc"
    }
  })
}

export async function getCSGOMatchById(matchId: string){
  return await prisma.match.findUnique({
    where:{id:matchId},
    include:{
      creator:true,
      joiner:true
    }
  })
}

export async function checkCSGOMatchResult(){
  try{
    const playingMatches = await prisma.match.findMany({
      where:{
        gameType: "CSGO",
        status: "PLAYING"
      }
    })

    for ( const match of playingMatches){
      if(!match.summonerPuuid1 || !match.summonerPuuid2 || !match.statsSnapshotBefore){
        continue
      }

      const currentStats1 = await captureCSGOStatsSnapshot(match.summonerPuuid1)
      const currentStats2 = await captureCSGOStatsSnapshot(match.summonerPuuid2)

      if (!currentStats1 || !currentStats2) {
        continue
      }

      const beforeSnapshot = match.statsSnapshotBefore as any
      const beforeStats1 = beforeSnapshot as CSGOMatchSnapshot
      const beforeStats2 = beforeSnapshot.player2 as CSGOMatchSnapshot


    const result = compareCSGOSnapshots(
        beforeStats1,
        currentStats1,
        beforeStats2,
        currentStats2
      )

      if (result) {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: "FINISHED",
            winner: result,
            statsSnapshotAfter: {
              player1: currentStats1,
              player2: currentStats2
            } as any,
            finishedAt: new Date()
          }
        })

        console.log(`✅ CS:GO Match ${match.id} finished! Winner: ${result}`)
      }
    }

  } catch (err) {
    console.error("Error checking CS:GO match results:", err)
    throw err
  }
}

export async function createFortniteMatch(
  username: string,
  epicUsername: string,
  platform: string = 'pc'
) {
  try {
    const playerData = await getFortnitePlayer(epicUsername, platform)

    if (!playerData) {
      throw new Error("Fortnite player not found. Check your Epic username and platform!")
    }

    // Capture initial snapshot
    const snapshot = await captureFortniteSnapshot(epicUsername, platform)
    
    if (!snapshot) {
      throw new Error("Failed to capture player stats. Try again!")
    }

    let user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { username }
      })
    }

    const match = await prisma.match.create({
      data: {
        gameType: "FORTNITE",
        creatorId: user.id,
        summonerName1: epicUsername,
        summonerPuuid1: playerData.accountId,
        platform1: platform,
        beforeSnapshot1: JSON.stringify(snapshot), // Store snapshot as JSON
        status: 'WAITING'
      },
      include: {
        creator: true
      }
    })

    return match

  } catch (error) {
    console.error("Error creating Fortnite match:", error)
    throw error
  }
}

export async function joinFortniteMatch(
  matchId: string,
  username: string,
  epicUsername: string,
  platform: string = 'pc'
) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match || match.gameType !== "FORTNITE") {
      throw new Error("Match not found!")
    }

    if (match.status !== 'WAITING') {
      throw new Error("Match is no longer available")
    }

    const playerData = await getFortnitePlayer(epicUsername, platform)

    if (!playerData) {
      throw new Error("Fortnite player not found. Check your Epic username and platform!")
    }

    const snapshot = await captureFortniteSnapshot(epicUsername, platform)
    
    if (!snapshot) {
      throw new Error("Failed to capture player stats. Try again!")
    }

    let user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { username }
      })
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        joinerId: user.id,
        summonerName2: epicUsername,
        summonerPuuid2: playerData.accountId,
        platform2: platform,
        beforeSnapshot2: JSON.stringify(snapshot),
        status: 'PLAYING',
        startedAt: new Date()
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    return updatedMatch
  } catch (err) {
    console.error("Error joining Fortnite match:", err)
    throw err
  }
}

export async function getOpenFortniteMatches() {
  return await prisma.match.findMany({
    where: {
      gameType: 'FORTNITE',
      status: 'WAITING'
    },
    include: {
      creator: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function getAllFortniteMatches() {
  return await prisma.match.findMany({
    where: {
      gameType: 'FORTNITE'
    },
    include: {
      creator: true,
      joiner: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function getFortniteMatchById(matchId: string) {
  return await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      creator: true,
      joiner: true
    }
  })
}

export async function checkFortniteMatchResult() {
  try {
    const playingMatches = await prisma.match.findMany({
      where: {
        gameType: "FORTNITE",
        status: "PLAYING"
      }
    })

    for (const match of playingMatches) {
      if (!match.summonerName1 || !match.summonerName2 || 
          !match.beforeSnapshot1 || !match.beforeSnapshot2) {
        continue
      }

      // Check if enough time has passed (at least 15 minutes for a Fortnite match)
      const timeSinceStart = Date.now() - (match.startedAt?.getTime() || 0)
      if (timeSinceStart < 15 * 60 * 1000) { // 15 minutes minimum
        continue
      }

      // Capture new snapshots
      const player1After = await captureFortniteSnapshot(
        match.summonerName1,
        match.platform1 || 'pc'
      )
      const player2After = await captureFortniteSnapshot(
        match.summonerName2,
        match.platform2 || 'pc'
      )

      if (!player1After || !player2After) {
        continue
      }

      // Parse before snapshots
      const player1Before: FortniteSnapshot = JSON.parse(match.beforeSnapshot1)
      const player2Before: FortniteSnapshot = JSON.parse(match.beforeSnapshot2)

      // Determine winner
      const winner = determineFortniteWinner(
        player1Before,
        player1After,
        player2Before,
        player2After
      )

      if (winner) {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: "FINISHED",
            winner: winner,
            afterSnapshot1: JSON.stringify(player1After),
            afterSnapshot2: JSON.stringify(player2After),
            finishedAt: new Date()
          }
        })

        console.log(`✅ Fortnite Match ${match.id} finished! Winner: ${winner}`)
      }
    }

  } catch (err) {
    console.error("Error checking Fortnite match results:", err)
    throw err
  }
}

// Helper function to manually submit match result
export async function submitFortniteMatchResult(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match || match.gameType !== "FORTNITE" || match.status !== "PLAYING") {
      throw new Error("Invalid match")
    }

    if (!match.summonerName1 || !match.summonerName2 || 
        !match.beforeSnapshot1 || !match.beforeSnapshot2) {
      throw new Error("Match data incomplete")
    }

    const player1After = await captureFortniteSnapshot(
      match.summonerName1,
      match.platform1 || 'pc'
    )
    const player2After = await captureFortniteSnapshot(
      match.summonerName2,
      match.platform2 || 'pc'
    )

    if (!player1After || !player2After) {
      throw new Error("Failed to capture current stats")
    }

    const player1Before: FortniteSnapshot = JSON.parse(match.beforeSnapshot1)
    const player2Before: FortniteSnapshot = JSON.parse(match.beforeSnapshot2)

    const winner = determineFortniteWinner(
      player1Before,
      player1After,
      player2Before,
      player2After
    )

    if (!winner) {
      throw new Error("No matches played yet or unable to determine winner")
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "FINISHED",
        winner: winner,
        afterSnapshot1: JSON.stringify(player1After),
        afterSnapshot2: JSON.stringify(player2After),
        finishedAt: new Date()
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    return updatedMatch
  } catch (err) {
    console.error("Error submitting Fortnite match result:", err)
    throw err
  }
}

export async function createRocketLeagueMatch(
  username: string,
  playerName: string,
  platform: string = 'steam'
) {
  try {
    const playerData = await getRocketLeaguePlayer(playerName, platform)

    if (!playerData) {
      throw new Error("Rocket League player not found. Check your username and platform!")
    }

    const snapshot = await captureRocketLeagueSnapshot(playerName, platform)
    
    if (!snapshot) {
      throw new Error("Failed to capture player stats. Make sure your profile is public!")
    }

    let user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { username }
      })
    }

    const match = await prisma.match.create({
      data: {
        gameType: "ROCKET_LEAGUE",
        creatorId: user.id,
        summonerName1: playerName,
        summonerPuuid1: playerData.platformId,
        platform1: platform,
        beforeSnapshot1: JSON.stringify(snapshot),
        status: 'WAITING'
      },
      include: {
        creator: true
      }
    })

    return match

  } catch (error) {
    console.error("Error creating Rocket League match:", error)
    throw error
  }
}

export async function joinRocketLeagueMatch(
  matchId: string,
  username: string,
  playerName: string,
  platform: string = 'steam'
) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match || match.gameType !== "ROCKET_LEAGUE") {
      throw new Error("Match not found!")
    }

    if (match.status !== 'WAITING') {
      throw new Error("Match is no longer available")
    }

    const playerData = await getRocketLeaguePlayer(playerName, platform)

    if (!playerData) {
      throw new Error("Rocket League player not found. Check your username and platform!")
    }

    const snapshot = await captureRocketLeagueSnapshot(playerName, platform)
    
    if (!snapshot) {
      throw new Error("Failed to capture player stats. Make sure your profile is public!")
    }

    let user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { username }
      })
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        joinerId: user.id,
        summonerName2: playerName,
        summonerPuuid2: playerData.platformId,
        platform2: platform,
        beforeSnapshot2: JSON.stringify(snapshot),
        status: 'PLAYING',
        startedAt: new Date()
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    return updatedMatch
  } catch (err) {
    console.error("Error joining Rocket League match:", err)
    throw err
  }
}

export async function getOpenRocketLeagueMatches() {
  return await prisma.match.findMany({
    where: {
      gameType: 'ROCKET_LEAGUE',
      status: 'WAITING'
    },
    include: {
      creator: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function getAllRocketLeagueMatches() {
  return await prisma.match.findMany({
    where: {
      gameType: 'ROCKET_LEAGUE'
    },
    include: {
      creator: true,
      joiner: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function getRocketLeagueMatchById(matchId: string) {
  return await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      creator: true,
      joiner: true
    }
  })
}

export async function checkRocketLeagueMatchResult() {
  try {
    const playingMatches = await prisma.match.findMany({
      where: {
        gameType: "ROCKET_LEAGUE",
        status: "PLAYING"
      }
    })

    for (const match of playingMatches) {
      if (!match.summonerName1 || !match.summonerName2 || 
          !match.beforeSnapshot1 || !match.beforeSnapshot2) {
        continue
      }

      const timeSinceStart = Date.now() - (match.startedAt?.getTime() || 0)
      if (timeSinceStart < 10 * 60 * 1000) {
        continue
      }

      const player1After = await captureRocketLeagueSnapshot(
        match.summonerName1,
        match.platform1 || 'steam'
      )
      const player2After = await captureRocketLeagueSnapshot(
        match.summonerName2,
        match.platform2 || 'steam'
      )

      if (!player1After || !player2After) {
        continue
      }

      const player1Before: RocketLeagueSnapshot = JSON.parse(match.beforeSnapshot1)
      const player2Before: RocketLeagueSnapshot = JSON.parse(match.beforeSnapshot2)

      const winner = determineRocketLeagueWinner(
        player1Before,
        player1After,
        player2Before,
        player2After
      )

      if (winner) {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: "FINISHED",
            winner: winner,
            afterSnapshot1: JSON.stringify(player1After),
            afterSnapshot2: JSON.stringify(player2After),
            finishedAt: new Date()
          }
        })

        console.log(`✅ Rocket League Match ${match.id} finished! Winner: ${winner}`)
      }
    }

  } catch (err) {
    console.error("Error checking Rocket League match results:", err)
    throw err
  }
}

export async function submitRocketLeagueMatchResult(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match || match.gameType !== "ROCKET_LEAGUE" || match.status !== "PLAYING") {
      throw new Error("Invalid match")
    }

    if (!match.summonerName1 || !match.summonerName2 || 
        !match.beforeSnapshot1 || !match.beforeSnapshot2) {
      throw new Error("Match data incomplete")
    }

    const player1After = await captureRocketLeagueSnapshot(
      match.summonerName1,
      match.platform1 || 'steam'
    )
    const player2After = await captureRocketLeagueSnapshot(
      match.summonerName2,
      match.platform2 || 'steam'
    )

    if (!player1After || !player2After) {
      throw new Error("Failed to capture current stats")
    }

    const player1Before: RocketLeagueSnapshot = JSON.parse(match.beforeSnapshot1)
    const player2Before: RocketLeagueSnapshot = JSON.parse(match.beforeSnapshot2)

    const winner = determineRocketLeagueWinner(
      player1Before,
      player1After,
      player2Before,
      player2After
    )

    if (!winner) {
      throw new Error("No matches played yet or unable to determine winner")
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "FINISHED",
        winner: winner,
        afterSnapshot1: JSON.stringify(player1After),
        afterSnapshot2: JSON.stringify(player2After),
        finishedAt: new Date()
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    return updatedMatch
  } catch (err) {
    console.error("Error submitting Rocket League match result:", err)
    throw err
  }
}