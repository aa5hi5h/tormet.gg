"use client"
import axios from "axios"
import { useState, useEffect } from "react"

interface MatchProps {
  creator: string,
  gameId: string,
  url: string,
  status: 'waiting' | 'playing' | 'finished',
  winner?: string // 'white' | 'black' | 'draw'
}

const ChessInterface = () => {

  const [name, setName] = useState<string>('')
  const [matches, setMatches] = useState<MatchProps[]>([])

  // Poll active games every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkMatchResults()
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [matches])

  const checkMatchResults = async () => {
    // Only check games that are playing (not finished)
    const activeMatches = matches.filter(m => m.status === 'playing')
    
    for (const match of activeMatches) {
      try {
        const response = await axios.get(`https://lichess.org/api/game/${match.gameId}`)
        const game = response.data
        
        // Check if game is finished
        if (game.status === 'mate' || game.status === 'resign' || game.status === 'outoftime' || game.status === 'draw') {
          
          // Update match with winner
          setMatches(prev => prev.map(m => 
            m.gameId === match.gameId 
              ? { ...m, status: 'finished', winner: game.winner || 'draw' }
              : m
          ))
        }
      } catch (error) {
        console.error('Error checking game:', error)
      }
    }
  }

  const onCreateMatch = async () => {
    console.log("function trigger")
    try {
      const request = await axios.post('https://lichess.org/api/challenge/open', { 
        clock: { limit: 300, increment: 0 },
        rated: false
      })
      
      console.log(request)
      
      setMatches(prev => [
        ...prev,
        {
          creator: name,
          gameId: request.data.id,
          url: request.data.url,
          status: 'waiting'
        }
      ])
    } catch (error) {
      console.error('Error creating match:', error)
    }
  }

  const onJoinMatch = (match: MatchProps) => {
    console.log("Join a match trigger")
    
    // Update status to 'playing' when someone joins
    setMatches(prev => prev.map(m => 
      m.gameId === match.gameId 
        ? { ...m, status: 'playing' }
        : m
    ))
    
    window.open(match.url, '_blank')
  }

  const getStatusBadge = (match: MatchProps) => {
    if (match.status === 'waiting') {
      return <span className="bg-yellow-200 px-2 py-1 rounded text-xs">Waiting</span>
    }
    if (match.status === 'playing') {
      return <span className="bg-blue-200 px-2 py-1 rounded text-xs">Playing...</span>
    }
    if (match.status === 'finished') {
      return (
        <span className="bg-green-200 px-2 py-1 rounded text-xs">
          Finished - Winner: {match.winner === 'draw' ? 'Draw' : match.winner}
        </span>
      )
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl p-4">
      <h1 className="text-2xl font-bold">Chess Match Interface</h1>
      
      <input
        placeholder="Your username"
        className="border p-2 rounded-md"
        value={name}
        onChange={(e) => setName(e.target.value)} 
      />
      
      <button 
        onClick={onCreateMatch} 
        className="bg-blue-500 text-white p-2 rounded-md cursor-pointer hover:bg-blue-600"
        disabled={!name}
      >
        Create Match
      </button>

      <h2 className="text-xl font-semibold mt-4">Open Matches</h2>
      
      <div>
        {matches.length === 0 ? (
          <p className="text-gray-500">No matches yet. Create one!</p>
        ) : (
          matches.map((match, index) => (
            <div 
              key={index} 
              className="border border-gray-300 p-4 rounded-md mb-2"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Creator: {match.creator}</p>
                  <p className="text-sm text-gray-600">Game ID: {match.gameId}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {getStatusBadge(match)}
                  {match.status === 'waiting' && (
                    <button 
                      onClick={() => onJoinMatch(match)}
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                    >
                      Join Match
                    </button>
                  )}
                  {match.status === 'playing' && (
                    <button 
                      onClick={() => window.open(match.url, '_blank')}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                      Watch Game
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ChessInterface