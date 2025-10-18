'use server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'

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