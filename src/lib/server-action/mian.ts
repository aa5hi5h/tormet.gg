'use server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import { determineValorantWinner, determineWinner, findMatchBetweenPlayers, findValorantMatchBetweenPlayers, getSummonerByName, getValorantAccount } from './riot-api'
import { determineDotaWinner, findDotaMatchBetweenPlayers, getDotaPlayer } from './dota-api'
import { captureCSGOStatsSnapshot, compareCSGOSnapshots, CSGOMatchSnapshot, getSteamPlayer, isValidSteamId, resolveSteamVanityURL } from './steam-api'
import { captureFortniteSnapshot, determineFortniteWinner, FortniteSnapshot, getFortnitePlayer } from './fortnite-api'
import { captureRocketLeagueSnapshot, determineRocketLeagueWinner, getRocketLeaguePlayer, RocketLeagueSnapshot } from './rocket-league-api'
import { determineClashRoyaleWinner, findClashRoyaleBattleBetweenPlayers, formatClashRoyaleTag, getClashRoyalePlayer, isValidClashRoyaleTag } from './clash-royale-api'
import { determineBrawlStarsWinner, findBrawlStarsBattleBetweenPlayers, formatBrawlStarsTag, getBrawlStarsPlayer, isValidBrawlStarsTag } from './brawl-star-api'
import { determineClanWarWinner, findWarBetweenClans, formatClanTag, getClan, getCurrentWar, getTimeRemaining, getWarState } from './coc-api'
import { capturePlayerStatsSnapshot, comparePUBGSnapshots, getPlayerByName, PUBGPlatform, PUBGPlayerStats, validatePUBGPlayer } from './pubg-api'
import { NextRequest, NextResponse } from 'next/server'
import { processDrawPayout, processRefund, processWinnerPayout } from '../solana-escrow'
import { Keypair } from '@solana/web3.js'

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
      status: 'WAITING',
      joinerId: null
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
      try {
            const payoutResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ matchId: match.id })
            })

            const payoutData = await payoutResponse.json()

            if (payoutData.success) {
              console.log(`💰 Payout processed! TX: ${payoutData.txHash}`)
            } else {
              console.error(`⚠️ Payout failed: ${payoutData.error}`)
            }
          } catch (payoutError) {
            console.error(`❌ Error triggering payout:`, payoutError)
          }
        }catch (error) {
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

export async function CreateClashRoyaleMatch(
  username: string,
  playerTag: string,
  playerName?: string
) {
  try {
    if (!isValidClashRoyaleTag(playerTag)) {
      throw new Error("Invalid Clash Royale player tag. Format: #ABC123XYZ")
    }

    const formattedTag = formatClashRoyaleTag(playerTag)
    
    const playerData = await getClashRoyalePlayer(formattedTag)
    if (!playerData) {
      throw new Error("Clash Royale player not found. Check your player tag!")
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
        gameType: "CLASH_ROYALE",
        creatorId: user.id,
        summonerName1: playerName || playerData.name,
        summonerPuuid1: formattedTag,
        status: 'WAITING'
      },
      include: {
        creator: true
      }
    })

    return match

  } catch (error) {
    console.error("Error creating Clash Royale match:", error)
    throw error
  }
}

export async function joinClashRoyaleMatch(matchId: string, username: string, playerTag: string, playerName?: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match || match.gameType !== "CLASH_ROYALE") {
      throw new Error("Match not found!")
    }

    if (match.status !== 'WAITING') {
      throw new Error("Match is no longer available")
    }

    if (!isValidClashRoyaleTag(playerTag)) {
      throw new Error("Invalid Clash Royale player tag")
    }

    const formattedTag = formatClashRoyaleTag(playerTag)

    const playerData = await getClashRoyalePlayer(formattedTag)
    if (!playerData) {
      throw new Error("Clash Royale player not found!")
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
        summonerName2: playerName || playerData.name,
        summonerPuuid2: formattedTag,
        status: 'PLAYING'
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    return updatedMatch
  } catch (err) {
    console.error("Error joining Clash Royale match:", err)
    throw err
  }
}

export async function getOpenClashRoyaleMatches() {
  return await prisma.match.findMany({
    where: {
      gameType: 'CLASH_ROYALE',
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

export async function getAllClashRoyaleMatches() {
  return await prisma.match.findMany({
    where: {
      gameType: 'CLASH_ROYALE'
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

export async function getClashRoyaleMatchById(matchId: string) {
  return await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      creator: true,
      joiner: true
    }
  })
}

export async function CheckClashRoyaleMatchResult() {
  try {
    const playingMatches = await prisma.match.findMany({
      where: {
        gameType: "CLASH_ROYALE",
        status: "PLAYING"
      }
    })

    for (const match of playingMatches) {
      if (!match.summonerPuuid1 || !match.summonerPuuid2) {
        continue
      }

      const battle = await findClashRoyaleBattleBetweenPlayers(
        match.summonerPuuid1,
        match.summonerPuuid2,
        match.createdAt.getTime()
      )

      if (battle) {
        const winner = determineClashRoyaleWinner(
          battle,
          match.summonerPuuid1,
          match.summonerPuuid2
        )

        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: "FINISHED",
            winner: winner,
            riotMatchId: battle.battleTime, 
            finishedAt: new Date()
          }
        })

        console.log(`✅ Clash Royale Match ${match.id} finished! Winner: ${winner}`)
      }
    }

  } catch (err) {
    console.error("Error checking Clash Royale match results:", err)
    throw err
  }
}

export async function CreateBrawlStarsMatch(
  username: string,
  playerTag: string,
  playerName?: string
) {
  try {
    if (!isValidBrawlStarsTag(playerTag)) {
      throw new Error("Invalid Brawl Stars player tag. Format: #ABC123XYZ")
    }

    const formattedTag = formatBrawlStarsTag(playerTag)
    
    const playerData = await getBrawlStarsPlayer(formattedTag)
    if (!playerData) {
      throw new Error("Brawl Stars player not found. Check your player tag!")
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
        gameType: "BRAWL_STARS",
        creatorId: user.id,
        summonerName1: playerName || playerData.name,
        summonerPuuid1: formattedTag,
        status: 'WAITING'
      },
      include: {
        creator: true
      }
    })

    return match

  } catch (error) {
    console.error("Error creating Brawl Stars match:", error)
    throw error
  }
}

export async function joinBrawlStarsMatch(matchId: string, username: string, playerTag: string, playerName?: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match || match.gameType !== "BRAWL_STARS") {
      throw new Error("Match not found!")
    }

    if (match.status !== 'WAITING') {
      throw new Error("Match is no longer available")
    }

    if (!isValidBrawlStarsTag(playerTag)) {
      throw new Error("Invalid Brawl Stars player tag")
    }

    const formattedTag = formatBrawlStarsTag(playerTag)

    const playerData = await getBrawlStarsPlayer(formattedTag)
    if (!playerData) {
      throw new Error("Brawl Stars player not found!")
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
        summonerName2: playerName || playerData.name,
        summonerPuuid2: formattedTag,
        status: 'PLAYING'
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    return updatedMatch
  } catch (err) {
    console.error("Error joining Brawl Stars match:", err)
    throw err
  }
}

export async function getOpenBrawlStarsMatches() {
  return await prisma.match.findMany({
    where: {
      gameType: 'BRAWL_STARS',
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

export async function getAllBrawlStarsMatches() {
  return await prisma.match.findMany({
    where: {
      gameType: 'BRAWL_STARS'
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

export async function getBrawlStarsMatchById(matchId: string) {
  return await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      creator: true,
      joiner: true
    }
  })
}

export async function CheckBrawlStarsMatchResult() {
  try {
    const playingMatches = await prisma.match.findMany({
      where: {
        gameType: "BRAWL_STARS",
        status: "PLAYING"
      }
    })

    for (const match of playingMatches) {
      if (!match.summonerPuuid1 || !match.summonerPuuid2) {
        continue
      }

      const battle = await findBrawlStarsBattleBetweenPlayers(
        match.summonerPuuid1,
        match.summonerPuuid2,
        match.createdAt.getTime()
      )

      if (battle) {
        const winner = determineBrawlStarsWinner(
          battle,
          match.summonerPuuid1,
          match.summonerPuuid2
        )

        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: "FINISHED",
            winner: winner,
            riotMatchId: battle.battleTime,
            finishedAt: new Date()
          }
        })

        console.log(`✅ Brawl Stars Match ${match.id} finished! Winner: ${winner}`)
      }
    }

  } catch (err) {
    console.error("Error checking Brawl Stars match results:", err)
    throw err
  }
}

export async function createClanWarMatch(
  username: string,
  clanTag: string,
  clanName?: string
) {
  try {
    const formattedTag = formatClanTag(clanTag)

    const clan = await getClan(formattedTag)
    if (!clan) {
      throw new Error('Clan not found. Check your clan tag.')
    }

    if (!clan.isWarLogPublic) {
      throw new Error('Clan war log must be PUBLIC! Go to Clan Settings → War Log → Make Public')
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      throw new Error('User not found. Please sign up first.')
    }

    const match = await prisma.match.create({
      data: {
        gameType: 'CLASH_OF_CLANS',
        status: 'WAITING',
        wager: 0, 
        creatorId: user.id,
        summonerPuuid1: formattedTag, 
        summonerName1: clanName || clan.name, 
        region: clan.location?.name || 'Unknown',
        statsSnapshotBefore: {
          clanLevel: clan.clanLevel,
          clanPoints: clan.clanPoints,
          warWins: clan.warWins,
          warLosses: clan.warLosses,
          warTies: clan.warTies,
          members: clan.members,
          timestamp: Date.now()
        }
      },
      include: {
        creator: true
      }
    })

    console.log(`✅ CoC Clan War match created: ${match.id}`)
    return match
  } catch (error: any) {
    console.error('Error creating CoC clan war match:', error)
    throw new Error(error.message || 'Failed to create clan war match')
  }
}

export async function joinClanWarMatch(
  matchId: string,
  username: string,
  clanTag: string,
  clanName?: string
) {
  try {
    const formattedTag = formatClanTag(clanTag)

    const clan = await getClan(formattedTag)
    if (!clan) {
      throw new Error('Clan not found. Check your clan tag.')
    }

    if (!clan.isWarLogPublic) {
      throw new Error('Clan war log must be PUBLIC! Go to Clan Settings → War Log → Make Public')
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      throw new Error('User not found. Please sign up first.')
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      throw new Error('Match not found')
    }

    if (match.status !== 'WAITING') {
      throw new Error('Match is no longer available')
    }

    if (match.creatorId === user.id) {
      throw new Error('You cannot join your own match')
    }

    if (match.summonerPuuid1 === formattedTag) {
      throw new Error('Cannot match against the same clan!')
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        joinerId: user.id,
        summonerPuuid2: formattedTag,
        summonerName2: clanName || clan.name,
        status: 'PLAYING',
        statsSnapshotBefore: {
          ...(match.statsSnapshotBefore as any),
          opponent: {
            clanLevel: clan.clanLevel,
            clanPoints: clan.clanPoints,
            warWins: clan.warWins,
            warLosses: clan.warLosses,
            warTies: clan.warTies,
            members: clan.members,
            timestamp: Date.now()
          }
        }
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    console.log(`✅ Clan joined match: ${matchId}`)
    return updatedMatch
  } catch (error: any) {
    console.error('Error joining clan war match:', error)
    throw new Error(error.message || 'Failed to join clan war match')
  }
}

export async function getOpenClanWarMatches(){
  return await prisma.match.findMany({
    where:{
      gameType: "CLASH_OF_CLANS",
      status: "WAITING"
    },
    include: {
      creator: true
    },
    orderBy: {
      createdAt: "desc"
    }
  })
}

export async function getAllClanWarMatches(){
  return await prisma.match.findMany({
    where:{
      gameType: "CLASH_OF_CLANS"
    },
    include: {
      joiner: true,
      creator: true
    },
    orderBy: {
      createdAt: "desc"
    }
  })
}

export async function getClanWarMatchById(matchId: string) {
  return await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      creator: true,
      joiner: true
    }
  })
}

export async function getClanWarStatus(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match || !match.summonerPuuid1) {
      return null
    }

    // Get current war info for the clan
    const currentWar = await getCurrentWar(match.summonerPuuid1)
    
    if (!currentWar) {
      return {
        state: 'notInWar',
        message: 'No active war found'
      }
    }

    const isCorrectWar = match.summonerPuuid2 && 
      (currentWar.opponent.tag === match.summonerPuuid2 || 
       currentWar.clan.tag === match.summonerPuuid2)

    return {
      state: getWarState(currentWar),
      isCorrectOpponent: isCorrectWar,
      teamSize: currentWar.teamSize,
      preparationStartTime: currentWar.preparationStartTime,
      startTime: currentWar.startTime,
      endTime: currentWar.endTime,
      timeRemaining: getTimeRemaining(currentWar),
      clan: {
        tag: currentWar.clan.tag,
        name: currentWar.clan.name,
        stars: currentWar.clan.stars,
        destructionPercentage: currentWar.clan.destructionPercentage,
        attacks: currentWar.clan.attacks
      },
      opponent: {
        tag: currentWar.opponent.tag,
        name: currentWar.opponent.name,
        stars: currentWar.opponent.stars,
        destructionPercentage: currentWar.opponent.destructionPercentage,
        attacks: currentWar.opponent.attacks
      }
    }
  } catch (error) {
    console.error('Error getting clan war status:', error)
    return null
  }
}

export async function checkClanWarMatchResult() {
  try {
    const playingMatches = await prisma.match.findMany({
      where: {
        gameType: 'CLASH_OF_CLANS',
        status: 'PLAYING'
      }
    })

    console.log(`🔍 Checking ${playingMatches.length} active CoC clan wars...`)

    for (const match of playingMatches) {
      if (!match.summonerPuuid1 || !match.summonerPuuid2) {
        console.log(`⚠️ Match ${match.id} missing clan tags`)
        continue
      }

      try {
        const war = await findWarBetweenClans(
          match.summonerPuuid1,
          match.summonerPuuid2,
          match.createdAt.getTime()
        )

        if (!war) {
          console.log(`⏳ No war found yet for match ${match.id}`)
          continue
        }

        console.log(`📊 War found for match ${match.id}: ${war.state}`)

        if (war.state !== 'warEnded') {
          console.log(`⏳ War still active for match ${match.id}: ${war.state}`)
          continue
        }

        const winner = determineClanWarWinner(
          war,
          match.summonerPuuid1,
          match.summonerPuuid2
        )

        if (!winner) {
          console.log(`⚠️ Could not determine winner for match ${match.id}`)
          continue
        }

        // Update match with results
        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: 'FINISHED',
            winner: winner,
            finishedAt: new Date(),
            statsSnapshotAfter: {
              state: war.state,
              endTime: war.endTime,
              clan: {
                tag: war.clan.tag,
                name: war.clan.name,
                stars: war.clan.stars,
                destructionPercentage: war.clan.destructionPercentage,
                attacks: war.clan.attacks
              },
              opponent: {
                tag: war.opponent.tag,
                name: war.opponent.name,
                stars: war.opponent.stars,
                destructionPercentage: war.opponent.destructionPercentage,
                attacks: war.opponent.attacks
              }
            }
          }
        })

        console.log(`✅ CoC Clan War match ${match.id} finished! Winner: ${winner}`)
        console.log(`   ${war.clan.name}: ${war.clan.stars} stars, ${war.clan.destructionPercentage}%`)
        console.log(`   ${war.opponent.name}: ${war.opponent.stars} stars, ${war.opponent.destructionPercentage}%`)

      } catch (matchError) {
        console.error(`Error processing match ${match.id}:`, matchError)
        continue
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error checking CoC clan war results:', error)
    throw error
  }
}

export async function cancelClanWarMatch(matchId: string, username: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { creator: true }
    })

    if (!match) {
      throw new Error('Match not found')
    }

    if (match.creator.username !== username) {
      throw new Error('Only the match creator can cancel')
    }

    if (match.status !== 'WAITING') {
      throw new Error('Can only cancel matches that are waiting')
    }

    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'CANCELLED'
      }
    })

    console.log(`❌ Match ${matchId} cancelled by ${username}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error cancelling match:', error)
    throw new Error(error.message || 'Failed to cancel match')
  }
}

export async function getClanWarMatchStats(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        creator: true,
        joiner: true
      }
    })

    if (!match) {
      return null
    }

    const beforeStats = match.statsSnapshotBefore as any
    const afterStats = match.statsSnapshotAfter as any

    return {
      match,
      before: beforeStats,
      after: afterStats,
      duration: match.finishedAt 
        ? match.finishedAt.getTime() - match.createdAt.getTime()
        : null
    }
  } catch (error) {
    console.error('Error getting match stats:', error)
    return null
  }
}


export async function createPUBGMatch(
  username: string,
  playerName: string,
  platform: PUBGPlatform = 'steam',
  wager: number = 0
) {
  try {
    // Validate player exists
    const validation = await validatePUBGPlayer(playerName, platform)
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid player')
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      throw new Error('User not found. Please sign up first.')
    }

    // Get player data
    const player = await getPlayerByName(playerName, platform)
    if (!player) {
      throw new Error('Failed to fetch player data')
    }

    // Capture initial stats
    const initialStats = await capturePlayerStatsSnapshot(player.id, platform)
    if (!initialStats) {
      throw new Error('Failed to capture player stats. Player may have no recent matches.')
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        gameType: 'PUBG_PC',
        status: 'WAITING',
        wager: wager,
        creatorId: user.id,
        summonerName1: playerName,
        summonerPuuid1: player.id, // Store PUBG account ID
        region: platform, // Store platform in region field
        statsSnapshotBefore: {
          player1: initialStats,
          timestamp: Date.now(),
          platform: platform
        } as any
      },
      include: {
        creator: true
      }
    })

    console.log(`✅ PUBG match created: ${match.id}`)
    return match
  } catch (error: any) {
    console.error('Error creating PUBG match:', error)
    throw new Error(error.message || 'Failed to create PUBG match')
  }
}

export async function joinPUBGMatch(
  matchId: string,
  username: string,
  playerName: string
) {
  try {
    // Get match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { creator: true }
    })

    if (!match) {
      throw new Error('Match not found')
    }

    if (match.status !== 'WAITING') {
      throw new Error('Match is no longer available')
    }

    const platform = (match.region as PUBGPlatform) || 'steam'

    // Validate player exists
    const validation = await validatePUBGPlayer(playerName, platform)
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid player')
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      throw new Error('User not found. Please sign up first.')
    }

    if (match.creatorId === user.id) {
      throw new Error('You cannot join your own match')
    }

    // Check if same player
    if (match.summonerName1?.toLowerCase() === playerName.toLowerCase()) {
      throw new Error('Cannot match against the same player!')
    }

    // Get player data
    const player = await getPlayerByName(playerName, platform)
    if (!player) {
      throw new Error('Failed to fetch player data')
    }

    // Capture initial stats for joiner
    const initialStats = await capturePlayerStatsSnapshot(player.id, platform)
    if (!initialStats) {
      throw new Error('Failed to capture player stats. Player may have no recent matches.')
    }

    const beforeSnapshot = match.statsSnapshotBefore as any

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        joinerId: user.id,
        summonerName2: playerName,
        summonerPuuid2: player.id,
        status: 'PLAYING',
        statsSnapshotBefore: {
          ...beforeSnapshot,
          player2: initialStats
        }
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    console.log(`✅ Player joined PUBG match: ${matchId}`)
    return updatedMatch
  } catch (error: any) {
    console.error('Error joining PUBG match:', error)
    throw new Error(error.message || 'Failed to join PUBG match')
  }
}

export async function getOpenPUBGMatches(){
  return await prisma.match.findMany({
    where:{
      gameType: "PUBG_PC",
      status: "WAITING"
    },
    include:{
      creator: true
    },
    orderBy:{
      createdAt: "desc"
    }
  })
}

export async function getAllPUBGMatches(){
  return await prisma.match.findMany({
    where: {
      gameType: "PUBG_PC"
    },
    include:{
      joiner: true,
      creator: true
    },
    orderBy: {
      createdAt: "desc"
    }    
  })
}

export async function getPUBGMatchById(matchId: string){
  return await prisma.match.findUnique({
    where:{id:matchId},
    include:{
      creator: true,
      joiner:true
    }
  })
}

export async function checkPUBGMatchResult() {
  try {
    const playingMatches = await prisma.match.findMany({
      where: {
        gameType: 'PUBG_PC',
        status: 'PLAYING'
      }
    })

    console.log(`🔍 Checking ${playingMatches.length} active PUBG matches...`)

    for (const match of playingMatches) {
      if (!match.summonerPuuid1 || !match.summonerPuuid2 || !match.statsSnapshotBefore) {
        console.log(`⚠️ Match ${match.id} missing required data`)
        continue
      }

      try {
        const platform = (match.region as PUBGPlatform) || 'steam'

        const currentStats1 = await capturePlayerStatsSnapshot(match.summonerPuuid1, platform)
        const currentStats2 = await capturePlayerStatsSnapshot(match.summonerPuuid2, platform)

        if (!currentStats1 || !currentStats2) {
          console.log(`⏳ Waiting for stats for match ${match.id}`)
          continue
        }

        const beforeSnapshot = match.statsSnapshotBefore as any
        const beforeStats1 = beforeSnapshot.player1 as PUBGPlayerStats
        const beforeStats2 = beforeSnapshot.player2 as PUBGPlayerStats

        const result = comparePUBGSnapshots(
          beforeStats1,
          currentStats1,
          beforeStats2,
          currentStats2
        )

        if (result) {
          const player1Wins = (currentStats1.wins || 0) - (beforeStats1.wins || 0)
          const player2Wins = (currentStats2.wins || 0) - (beforeStats2.wins || 0)
          const player1Kills = (currentStats1.kills || 0) - (beforeStats1.kills || 0)
          const player2Kills = (currentStats2.kills || 0) - (beforeStats2.kills || 0)

          await prisma.match.update({
            where: { id: match.id },
            data: {
              status: 'FINISHED',
              winner: result,
              statsSnapshotAfter: {
                player1: currentStats1,
                player2: currentStats2,
                differences: {
                  player1: {
                    wins: player1Wins,
                    kills: player1Kills,
                    damage: (currentStats1.damageDealt || 0) - (beforeStats1.damageDealt || 0)
                  },
                  player2: {
                    wins: player2Wins,
                    kills: player2Kills,
                    damage: (currentStats2.damageDealt || 0) - (beforeStats2.damageDealt || 0)
                  }
                },
                timestamp: Date.now()
              } as any,
              finishedAt: new Date()
            }
          })

          console.log(`✅ PUBG Match ${match.id} finished! Winner: ${result}`)
          console.log(`   ${match.summonerName1}: ${player1Wins} wins, ${player1Kills} kills`)
          console.log(`   ${match.summonerName2}: ${player2Wins} wins, ${player2Kills} kills`)

          try {
            const payoutResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ matchId: match.id })
            })

            const payoutData = await payoutResponse.json()

            if (payoutData.success) {
              console.log(`💰 Payout processed! TX: ${payoutData.txHash}`)
            } else {
              console.error(`⚠️ Payout failed: ${payoutData.error}`)
            }
          } catch (payoutError) {
            console.error(`❌ Error triggering payout:`, payoutError)
          }
        } else {
          console.log(`⏳ No conclusive result yet for match ${match.id}`)
        }
      } catch (matchError) {
        console.error(`Error processing PUBG match ${match.id}:`, matchError)
        continue
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error checking PUBG match results:', error)
    throw error
  }
}

export async function cancelPUBGMatch(matchId: string, username: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { creator: true }
    })

    if (!match) {
      throw new Error('Match not found')
    }

    if (match.creator.username !== username) {
      throw new Error('Only the match creator can cancel')
    }

    if (match.status !== 'WAITING') {
      throw new Error('Can only cancel matches that are waiting')
    }

    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'CANCELLED'
      }
    })

    console.log(`❌ PUBG Match ${matchId} cancelled by ${username}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error cancelling match:', error)
    throw new Error(error.message || 'Failed to cancel match')
  }
}

export async function getPUBGPlayerCurrentStats(
  playerName: string,
  platform: PUBGPlatform = 'steam'
) {
  try {
    const player = await getPlayerByName(playerName, platform)
    if (!player) {
      return null
    }

    const stats = await capturePlayerStatsSnapshot(player.id, platform)
    return stats
  } catch (error) {
    console.error('Error getting player stats:', error)
    return null
  }
}



export async function createMatchWithEscrow(
  username: string,
  gameType: string,
  wagerAmount: number,
  walletAddress: string,
  txHash: string,
  gameSpecificData: any
) {
  try {
    // Find or create user based on wallet address ONLY
    let user = await prisma.user.findUnique({
      where: { wallet: walletAddress }
    })

    if (!user) {
      // Create new user with this wallet
      user = await prisma.user.create({
        data: {
          username,
          wallet: walletAddress
        }
      })
      console.log(`✅ Created new user: ${username} with wallet: ${walletAddress}`)
    } else {
      // User exists with this wallet - optionally update username if changed
      if (user.username !== username) {
        user = await prisma.user.update({
          where: { wallet: walletAddress },
          data: { username }
        })
        console.log(`✅ Updated username for wallet ${walletAddress}: ${user.username} -> ${username}`)
      }
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        gameType: gameType as any,
        status: "WAITING",
        wager: wagerAmount,
        creatorId: user.id,
        createTxHash: txHash,
        ...gameSpecificData
      },
      include: {
        creator: true
      }
    })

    console.log(`✅ Match created with escrow: ${match.id}, TX: ${txHash}`)
    console.log(`🎨 Colors stored - Creator: ${match.creatorColor}, Joiner: ${match.joinerColor}`)

    
    return match
  } catch (err: any) {
    console.error("Error creating match with escrow:", err)
    throw new Error(err.message || "Failed to create match with escrow")
  }
}

export async function joinMatchWithEscrow(
  matchId: string,
  username: string,
  walletAddress: string,
  txHash: string,
  gameSpecificData: any
) {
  try {
    // Get match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        creator: true
      }
    })

    if (!match) {
      throw new Error("Match not found")
    }

    if (match.status !== "WAITING") {
      throw new Error("Match is not available to join")
    }

    // Find or create user based on wallet address ONLY
    let user = await prisma.user.findUnique({
      where: { wallet: walletAddress }
    })

    if (!user) {
      // Create new user with this wallet
      user = await prisma.user.create({
        data: {
          username,
          wallet: walletAddress
        }
      })
      console.log(`✅ Created new user: ${username} with wallet: ${walletAddress}`)
    } else {
      // User exists with this wallet - optionally update username if changed
      if (user.username !== username) {
        user = await prisma.user.update({
          where: { wallet: walletAddress },
          data: { username }
        })
        console.log(`✅ Updated username for wallet ${walletAddress}: ${user.username} -> ${username}`)
      }
    }

    // Prevent joining own match
    if (match.creatorId === user.id) {
      throw new Error("You cannot join your own match")
    }

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        joinerId: user.id,
        joinTxHash: txHash,
        status: "PLAYING",
        ...gameSpecificData
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    console.log(`✅ Player joined match with escrow: ${matchId}, TX: ${txHash}`)
    console.log(`🔗 Match URL: ${updatedMatch.url}`)
    
    return updatedMatch
  } catch (error: any) {
    console.error('Error joining match with escrow:', error)
    throw new Error(error.message || 'Failed to join match')
  }
}
export async function finishMatchAndPayout(
  matchId: string,
  winner: 'CREATOR' | 'JOINER' | 'DRAW',
  statsAfter: any
) {
  try {
    // Update match status
    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'FINISHED',
        winner: winner,
        finishedAt: new Date(),
        statsSnapshotAfter: statsAfter as any
      },
      include: {
        creator: true,
        joiner: true
      }
    })

    console.log(`🏆 Match finished: ${matchId}, Winner: ${winner}`)

    try {
      const payoutResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ matchId })
      })

      const payoutData = await payoutResponse.json()

      if (payoutData.success) {
        console.log(`💰 Payout processed automatically! TX: ${payoutData.txHash}`)
      } else {
        console.error(`⚠️ Payout failed: ${payoutData.error}`)
      }
    } catch (payoutError) {
      console.error('Error triggering automatic payout:', payoutError)
    }

    return match
  } catch (error: any) {
    console.error('Error finishing match:', error)
    throw new Error(error.message || 'Failed to finish match')
  }
}

export async function getMatchPayoutStatus(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        creator: true,
        joiner: true
      }
    })

    if (!match) {
      throw new Error('Match not found')
    }

    return {
      matchId: match.id,
      status: match.status,
      winner: match.winner,
      wager: match.wager,
      createTxHash: match.createTxHash,
      joinTxHash: match.joinTxHash,
      payoutTxHash: match.payoutTxHash,
      winnerAmount: match.wager * 0.95,
      platformFee: match.wager * 0.05,
      isPaid: !!match.payoutTxHash
    }
  } catch (error: any) {
    console.error('Error getting payout status:', error)
    throw new Error(error.message || 'Failed to get payout status')
  }
}

export async function retryPayout(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      throw new Error('Match not found')
    }

    if (match.status !== 'FINISHED') {
      throw new Error('Match is not finished')
    }

    if (match.payoutTxHash) {
      throw new Error('Payout already processed')
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ matchId })
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Payout failed')
    }

    console.log(`✅ Payout retry successful! TX: ${data.txHash}`)
    return data
  } catch (error: any) {
    console.error('Error retrying payout:', error)
    throw new Error(error.message || 'Failed to retry payout')
  }
}

export async function cancelMatchAndRefund(matchId: string, username: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { creator: true, joiner: true }
    })

    if (!match) {
      throw new Error('Match not found')
    }

    if (match.creator.username !== username) {
      throw new Error('Only creator can cancel match')
    }

    if (match.status === 'FINISHED') {
      throw new Error('Cannot cancel finished match')
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payout`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ matchId })
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Refund failed')
    }

    console.log(`🔄 Match cancelled and refunds processed: ${matchId}`)
    return data
  } catch (error: any) {
    console.error('Error cancelling match:', error)
    throw new Error(error.message || 'Failed to cancel match')
  }
}

export async function getUserTransactionHistory(username: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        createdMatches: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        joinedMatches: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const allMatches = [
      ...user.createdMatches.map(m => ({ ...m, role: 'creator' })),
      ...user.joinedMatches.map(m => ({ ...m, role: 'joiner' }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return {
      user: {
        username: user.username,
        wallet: user.wallet,
        balance: user.balance
      },
      matches: allMatches.map(match => ({
        id: match.id,
        gameType: match.gameType,
        status: match.status,
        winner: match.winner,
        wager: match.wager,
        role: match.role,
        createTxHash: match.createTxHash,
        joinTxHash: match.joinTxHash,
        payoutTxHash: match.payoutTxHash,
        createdAt: match.createdAt,
        finishedAt: match.finishedAt,
        isWinner: match.status === 'FINISHED' && 
                  ((match.role === 'creator' && match.winner === 'CREATOR') ||
                   (match.role === 'joiner' && match.winner === 'JOINER')),
        isDraw: match.winner === 'DRAW'
      }))
    }
  } catch (error: any) {
    console.error('Error getting transaction history:', error)
    throw new Error(error.message || 'Failed to get transaction history')
  }
}

export async function getPlatformStats() {
  try {
    const totalMatches = await prisma.match.count()
    const finishedMatches = await prisma.match.count({
      where: { status: 'FINISHED' }
    })
    const activeMatches = await prisma.match.count({
      where: { status: 'PLAYING' }
    })

    const totalWagered = await prisma.match.aggregate({
      where: { status: 'FINISHED' },
      _sum: { wager: true }
    })

    const totalPaidOut = await prisma.match.aggregate({
      where: { 
        status: 'FINISHED',
        payoutTxHash: { not: null }
      },
      _sum: { wager: true }
    })

    return {
      totalMatches,
      finishedMatches,
      activeMatches,
      totalWagered: totalWagered._sum.wager || 0,
      totalPaidOut: (totalPaidOut._sum.wager || 0) * 0.95,
      platformFees: (totalPaidOut._sum.wager || 0) * 0.05
    }
  } catch (error: any) {
    console.error('Error getting platform stats:', error)
    throw new Error(error.message || 'Failed to get platform stats')
  }
}