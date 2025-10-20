"use client"
import axios from "axios"
import { useState, useEffect } from "react"
import { createMatch, joinMatch, getOpenMatches, checkAndUpdateGameResults, getAllActiveMatches } from "../../lib/server-action/mian"

interface MatchProps {
  id: string
  creator: {
    username: string
  }
  joiner?: {
    username: string
  } | null
  gameId: string
  url: string
  status: 'WAITING' | 'PLAYING' | 'FINISHED' | 'CANCELLED'
  winner?: 'WHITE' | 'BLACK' | 'DRAW' | null
}

const ChessInterface = () => {

  const [name, setName] = useState<string>('')
  const [matches, setMatches] = useState<MatchProps[]>([])
  const [loading, setLoading] = useState(false)
  const [myActiveMatches, setMyActiveMatches] = useState<string[]>([])
  const [previousMatchStates, setPreviousMatchStates] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    loadMatches()
  }, [])

  
   useEffect(() => {
    const interval = setInterval(async () => {
      await checkAndUpdateGameResults()
      
      const allMatches = await getAllActiveMatches()
      
      allMatches.forEach((match: any) => {
        if (myActiveMatches.includes(match.id)) {
          const previousStatus = previousMatchStates.get(match.id)
          
          if (previousStatus === 'WAITING' && match.status === 'PLAYING') {
            console.log('🎮 Match started! Redirecting...', match.gameId)
            window.open(match.url, '_blank')
          }
          
          setPreviousMatchStates(prev => new Map(prev).set(match.id, match.status))
        }
      })

      const openMatches = await getOpenMatches()
      setMatches(openMatches as any)
      
    }, 15000) 

    return () => clearInterval(interval)
  }, [matches, myActiveMatches])

  const loadMatches = async () => {
    try {
      const openMatches = await getOpenMatches()
      setMatches(openMatches as any)
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  const onCreateMatch = async () => {
    if (!name) return
    
    setLoading(true)
    try {
      const request = await axios.post('https://lichess.org/api/challenge/open', { 
        clock: { limit: 300, increment: 0 },
        rated: false
      })
      
      console.log('Lichess response:', request.data)
      
      const match = await createMatch(
        name,
        request.data.id,
        request.data.url
      )

      setMyActiveMatches(prev => [...prev, (match as any).id])

      await loadMatches()
      
    } catch (error) {
      console.error('Error creating match:', error)
      alert('Error creating match. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onJoinMatch = async (match: MatchProps) => {
    if (!name) {
      alert('Please enter your username first')
      return
    }
    
    if (match.creator.username === name) {
      alert('You cannot join your own match!')
      return
    }
    
    try {
      await joinMatch(match.id, name)
      
      window.open(match.url, '_blank')

      await loadMatches()
      
    } catch (error) {
      console.error('Error joining match:', error)
      alert('Error joining match. Please try again.')
    }
  }

  const getStatusBadge = (match: MatchProps) => {
    const isMyMatch = match.creator.username === name
    
    if (match.status === 'WAITING') {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isMyMatch ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'
        }`}>
          {isMyMatch ? '⏳ Waiting for opponent...' : '🟢 Available'}
        </span>
      )
    }
    if (match.status === 'PLAYING') {
      return (
        <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
          ♟️ Game in progress
        </span>
      )
    }
    if (match.status === 'FINISHED') {
      return (
        <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
          🏆 Winner: {match.winner === 'DRAW' ? 'Draw' : match.winner}
        </span>
      )
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl p-6 mx-auto">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4">
        <h2 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <span className="text-xl">ℹ️</span> How it works:
        </h2>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside ml-2">
          <li>Enter your username and <strong>create a match</strong></li>
          <li><strong>Stay on this page</strong> - you'll be redirected when someone joins</li>
          <li>When opponent joins, <strong>you'll both be redirected automatically</strong></li>
          <li>Play your game on Lichess and winner will be shown here!</li>
        </ol>
      </div>

      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">Chess Wagering</h1>
        {myActiveMatches.length > 0 && (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
            🎮 {myActiveMatches.length} active match{myActiveMatches.length > 1 ? 'es' : ''}
          </span>
        )}
      </div>
      
      <div className="flex gap-3">
        <input
          placeholder="Enter your username"
          className="border-2 border-gray-300 p-3 rounded-lg flex-1 focus:outline-none focus:border-blue-500 transition-colors"
          value={name}
          onChange={(e) => setName(e.target.value)} 
        />
        
        <button 
          onClick={onCreateMatch} 
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg cursor-pointer hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-bold shadow-md hover:shadow-lg transition-all"
          disabled={!name || loading}
        >
          {loading ? '⏳ Creating...' : '✨ Create Match'}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Available Matches</h2>
        <button
          onClick={loadMatches}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
        >
          🔄 Refresh
        </button>
        <span className="text-sm text-gray-500">
          Auto-refreshing every 5s
        </span>
      </div>
      
      <div className="space-y-3">
        {matches.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50">
            <div className="text-6xl mb-4">♟️</div>
            <p className="text-gray-500 text-lg">No matches available</p>
            <p className="text-gray-400 text-sm mt-2">Create the first one!</p>
          </div>
        ) : (
          matches.map((match) => {
            const isMyMatch = match.creator.username === name
            
            return (
              <div 
                key={match.id} 
                className={`border-2 p-5 rounded-xl shadow-sm hover:shadow-md transition-all ${
                  isMyMatch 
                    ? 'border-orange-300 bg-orange-50' 
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-bold text-xl">
                        {isMyMatch ? '👤 Your Match' : `🎮 ${match.creator.username}'s Match`}
                      </p>
                      {isMyMatch && match.status === 'WAITING' && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full animate-pulse">
                          Waiting...
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Game ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{match.gameId}</code>
                    </p>
                    {match.joiner && (
                      <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                        <span>⚔️</span>
                        <strong>{match.joiner.username}</strong> joined
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-3 items-end">
                    {getStatusBadge(match)}
                    
                    {match.status === 'WAITING' && !isMyMatch && (
                      <button 
                        onClick={() => onJoinMatch(match)}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 font-bold shadow-md hover:shadow-lg transition-all"
                      >
                        ⚡ Join & Play
                      </button>
                    )}
                    
                    {match.status === 'WAITING' && isMyMatch && (
                      <button 
                        onClick={() => window.open(match.url, '_blank')}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold text-sm"
                      >
                        🔗 Open Lichess Link
                      </button>
                    )}
                    
                    {match.status === 'PLAYING' && (
                      <button 
                        onClick={() => window.open(match.url, '_blank')}
                        className="bg-blue-500 text-white px-5 py-3 rounded-lg hover:bg-blue-600 font-semibold"
                      >
                        👀 Watch Game
                      </button>
                    )}
                    
                    {match.status === 'FINISHED' && (
                      <button 
                        onClick={() => window.open(match.url, '_blank')}
                        className="bg-gray-500 text-white px-5 py-3 rounded-lg hover:bg-gray-600 font-semibold"
                      >
                        📊 View Results
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ChessInterface