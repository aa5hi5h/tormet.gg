'use server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import { determineWinner, findMatchBetweenPlayers, getSummonerByName } from './riot-api'

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