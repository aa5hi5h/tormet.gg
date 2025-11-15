"use client"
import { useState, useEffect } from "react"
import { 
   CreateLOLMatch, 
  joinLoLMatch, 
  getOpenLOLMatches, 
  getAllLOLMatches,
  getLOLMatchById,
  checkAndUpdateGameResults 
} from "@/lib/server-action/mian"

interface LoLMatchProps {
  id: string
  creator: {
    username: string
  }
  joiner?: {
    username: string
  } | null
  summonerName1?: string | null
  summonerName2?: string | null
  region?: string | null
  status: 'WAITING' | 'PLAYING' | 'FINISHED' | 'CANCELLED'
  winner?: 'CREATOR' | 'JOINER' | 'DRAW' | null
  wager: number
  createdAt: Date
}

const REGIONS = {
  'NA': 'North America',
  'EUW': 'Europe West',
  'EUNE': 'Europe Nordic & East',
  'KR': 'Korea',
  'BR': 'Brazil',
  'LAN': 'Latin America North',
  'LAS': 'Latin America South',
  'OCE': 'Oceania',
  'TR': 'Turkey',
  'RU': 'Russia',
  'JP': 'Japan',
}

export default function LoLPage() {
  const [username, setUsername] = useState('')
  const [summonerName, setSummonerName] = useState('')
  const [region, setRegion] = useState('NA')
  const [wager, setWager] = useState('')
  
  const [openMatches, setOpenMatches] = useState<LoLMatchProps[]>([])
  const [playingMatches, setPlayingMatches] = useState<LoLMatchProps[]>([])
  const [finishedMatches, setFinishedMatches] = useState<LoLMatchProps[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [myActiveMatches, setMyActiveMatches] = useState<string[]>([])
  const [previousMatchStates, setPreviousMatchStates] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    loadAllMatches()
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      await checkAndUpdateGameResults()

      for (const matchId of myActiveMatches) {
        const currentMatch = await getLOLMatchById(matchId)
        const previousStatus = previousMatchStates.get(matchId)
        
        if (currentMatch) {
          setPreviousMatchStates(prev => new Map(prev).set(matchId, currentMatch.status))
          if (previousStatus === 'PLAYING' && currentMatch.status === 'FINISHED') {
            alert(`🏆 Match finished! Winner: ${currentMatch.winner}`)
          }
        }
      }
      
      await loadAllMatches()
    }, 10000)

    return () => clearInterval(interval)
  }, [myActiveMatches, previousMatchStates])

  const loadAllMatches = async () => {
    try {
      const allMatches = await getAllLOLMatches() as any[]
      
      setOpenMatches(allMatches.filter(m => m.status === 'WAITING'))
      setPlayingMatches(allMatches.filter(m => m.status === 'PLAYING'))
      setFinishedMatches(allMatches.filter(m => m.status === 'FINISHED'))
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  const handleCreateMatch = async () => {
    if (!username || !summonerName) {
      setError('Please enter username and summoner name')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const match = await CreateLOLMatch(username, summonerName, region)
      
      setMyActiveMatches(prev => [...prev, (match as any).id])
      setPreviousMatchStates(prev => new Map(prev).set((match as any).id, 'WAITING'))
      
      await loadAllMatches()
      
      setSummonerName('')
      setWager('')
      
      alert('✅ Match created! Waiting for opponent...')
    } catch (error: any) {
      setError(error.message || 'Failed to create match')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinMatch = async (match: LoLMatchProps) => {
    if (!username) {
      setError('Please enter your username first')
      return
    }

    if (match.creator.username === username) {
      setError('You cannot join your own match!')
      return
    }

    const joinerSummoner = prompt(`Enter your Summoner Name (Region: ${match.region}):`)
    if (!joinerSummoner) return

    setLoading(true)
    setError('')

    try {
      await joinLoLMatch(match.id, username, joinerSummoner)
      await loadAllMatches()
      alert('✅ Match joined! Check instructions below to start playing.')
    } catch (error: any) {
      setError(error.message || 'Failed to join match')
    } finally {
      setLoading(false)
    }
  }

  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-3 rounded-lg">
              <span className="text-2xl">⚔️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">League of Legends</h1>
              <p className="text-xs text-purple-300">Wager • Compete • Win</p>
            </div>
          </div>
          <a href="/" className="text-sm text-blue-300 hover:text-blue-200">
            ← Back to Games
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-6 mb-8">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span>ℹ️</span> How It Works
          </h2>
          <ol className="space-y-2 text-sm text-blue-100 list-decimal list-inside">
            <li>Create a match with your Summoner Name and wager amount</li>
            <li>Wait for an opponent to join (they'll use their Summoner Name)</li>
            <li>Both players add each other in League of Legends</li>
            <li>Play a game together (Custom 1v1 or any mode on opposite teams)</li>
            <li>Winner is automatically detected and receives the payout!</li>
          </ol>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Create Match</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Summoner Name</label>
              <input
                type="text"
                value={summonerName}
                onChange={(e) => setSummonerName(e.target.value)}
                placeholder="Your LoL summoner name"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
              >
                {Object.entries(REGIONS).map(([code, name]) => (
                  <option key={code} value={code} className="bg-gray-900">
                    {name} ({code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Wager Amount (SOL)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={wager}
                onChange={(e) => setWager(e.target.value)}
                placeholder="0.5"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-purple-300 mt-1">
                Winner gets {wager ? (parseFloat(wager) * 1.95).toFixed(2) : '0.00'} SOL (5% fee)
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateMatch}
            disabled={loading || !username || !summonerName}
            className="mt-6 w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 px-6 py-3 rounded-lg font-bold disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Creating...' : '✨ Create Match'}
          </button>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">🟢 Available Matches</h2>
            <button
              onClick={loadAllMatches}
              className="text-sm text-blue-300 hover:text-blue-200"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="space-y-3">
            {openMatches.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                <p className="text-gray-400">No matches available. Create one!</p>
              </div>
            ) : (
              openMatches.map((match) => {
                const isMyMatch = match.creator.username === username

                return (
                  <div
                    key={match.id}
                    className={`bg-white/5 border rounded-xl p-5 ${
                      isMyMatch ? 'border-orange-400/50 bg-orange-500/10' : 'border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">⚔️</span>
                          <div>
                            <p className="font-bold text-lg">
                              {isMyMatch ? '👤 Your Match' : match.creator.username}
                            </p>
                            <p className="text-sm text-gray-400">
                              {match.summonerName1} • {match.region} • {getTimeSince(match.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">
                            💰 {match.wager} SOL wager
                          </span>
                          {isMyMatch && (
                            <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full animate-pulse">
                              ⏳ Waiting for opponent...
                            </span>
                          )}
                        </div>
                      </div>

                      {!isMyMatch && (
                        <button
                          onClick={() => handleJoinMatch(match)}
                          disabled={loading}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6 py-3 rounded-lg font-bold"
                        >
                          ⚡ Join Match
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {playingMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">♟️ Games in Progress</h2>
            <div className="space-y-4">
              {playingMatches.map((match) => {
                const isParticipant = match.creator.username === username || match.joiner?.username === username

                return (
                  <div
                    key={match.id}
                    className={`bg-white/5 border rounded-xl p-6 ${
                      isParticipant ? 'border-blue-400/50 bg-blue-500/10' : 'border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-xl mb-2">
                          {match.summonerName1} vs {match.summonerName2}
                        </p>
                        <div className="flex gap-2 text-sm">
                          <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                            🎮 Playing
                          </span>
                          <span className="text-gray-400">{match.region}</span>
                        </div>
                      </div>
                    </div>

                    {isParticipant && (
                      <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mt-4">
                        <p className="font-bold mb-3 text-blue-300">📋 Instructions:</p>
                        <ol className="space-y-2 text-sm list-decimal list-inside">
                          <li>Open League of Legends client</li>
                          <li>Add opponent as friend: <strong>{match.creator.username === username ? match.summonerName2 : match.summonerName1}</strong></li>
                          <li>Create Custom 1v1 game OR play any mode (opposite teams!)</li>
                          <li>Play the match</li>
                          <li>Winner will be detected automatically! ⏱️ Checking every 10s...</li>
                        </ol>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {finishedMatches.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">🏆 Completed Matches</h2>
            <div className="space-y-4">
              {finishedMatches.map((match) => {
                const creatorWon = match.winner === 'CREATOR'
                const joinerWon = match.winner === 'JOINER'
                const isDraw = match.winner === 'DRAW'

                return (
                  <div
                    key={match.id}
                    className="bg-white/5 border border-green-500/30 rounded-xl p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">{getTimeSince(match.createdAt)}</p>
                        <p className="font-bold text-xl">
                          {match.summonerName1} vs {match.summonerName2}
                        </p>
                      </div>
                      <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
                        ✅ Finished
                      </span>
                    </div>

                    <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg p-4">
                      <p className="text-center font-bold text-green-300 mb-3">
                        {isDraw ? '🤝 Draw' : '🏆 Winner'}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className={`flex-1 text-center p-3 rounded ${creatorWon ? 'bg-green-500/20' : 'bg-gray-800/30'}`}>
                          <p className={`font-bold ${creatorWon ? 'text-green-300' : 'text-gray-400'}`}>
                            {creatorWon && '👑 '}
                            {match.summonerName1}
                          </p>
                          <p className="text-xs text-gray-500">{match.creator.username}</p>
                        </div>
                        <span className="px-4 text-gray-500">VS</span>
                        <div className={`flex-1 text-center p-3 rounded ${joinerWon ? 'bg-green-500/20' : 'bg-gray-800/30'}`}>
                          <p className={`font-bold ${joinerWon ? 'text-green-300' : 'text-gray-400'}`}>
                            {joinerWon && '👑 '}
                            {match.summonerName2}
                          </p>
                          <p className="text-xs text-gray-500">{match.joiner?.username}</p>
                        </div>
                      </div>
                      {!isDraw && (
                        <p className="text-center text-green-400 font-semibold mt-3">
                          💰 Payout: {(match.wager * 1.95).toFixed(2)} SOL
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}