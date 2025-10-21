'use server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import { determineValorantWinner, determineWinner, findMatchBetweenPlayers, findValorantMatchBetweenPlayers, getSummonerByName, getValorantAccount } from './riot-api'
import { determineDotaWinner, findDotaMatchBetweenPlayers, getDotaPlayer } from './dota-api'

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