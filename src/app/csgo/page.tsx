"use client"
import { useState, useEffect } from "react"
import { 
  CreateCSGOMatch, 
  joinCSGOMatch, 
  getOpenCSGOMatches, 
  getAllCSGOMatches,
  getCSGOMatchById,
  checkAndUpdateGameResults 
} from "@/lib/server-action/mian"

interface CSGOMatchProps {
  id: string
  creator: {
    username: string
  }
  joiner?: {
    username: string
  } | null
  summonerName1?: string | null
  summonerName2?: string | null
  summonerPuuid1?: string | null
  summonerPuuid2?: string | null
  status: 'WAITING' | 'PLAYING' | 'FINISHED' | 'CANCELLED'
  winner?: 'CREATOR' | 'JOINER' | 'DRAW' | null
  wager: number
  createdAt: Date
}

export default function CSGOPage() {
  const [username, setUsername] = useState('')
  const [steamId, setSteamId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [wager, setWager] = useState('')
  
  const [openMatches, setOpenMatches] = useState<CSGOMatchProps[]>([])
  const [playingMatches, setPlayingMatches] = useState<CSGOMatchProps[]>([])
  const [finishedMatches, setFinishedMatches] = useState<CSGOMatchProps[]>([])
  
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
        const currentMatch = await getCSGOMatchById(matchId)
        const previousStatus = previousMatchStates.get(matchId)
        
        if (currentMatch) {
          setPreviousMatchStates(prev => new Map(prev).set(matchId, currentMatch.status))
          
          if (previousStatus === 'PLAYING' && currentMatch.status === 'FINISHED') {
            alert(`🏆 Match finished! Winner: ${currentMatch.winner}`)
          }
        }
      }
      
      await loadAllMatches()
    }, 15000) 

    return () => clearInterval(interval)
  }, [myActiveMatches, previousMatchStates])

  const loadAllMatches = async () => {
    try {
      const allMatches = await getAllCSGOMatches() as any[]
      
      setOpenMatches(allMatches.filter(m => m.status === 'WAITING'))
      setPlayingMatches(allMatches.filter(m => m.status === 'PLAYING'))
      setFinishedMatches(allMatches.filter(m => m.status === 'FINISHED'))
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  const handleCreateMatch = async () => {
    if (!username || !steamId) {
      setError('Please enter username and Steam ID')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const match = await CreateCSGOMatch(username, steamId, playerName)
      
      setMyActiveMatches(prev => [...prev, (match as any).id])
      setPreviousMatchStates(prev => new Map(prev).set((match as any).id, 'WAITING'))
      
      await loadAllMatches()
      
      setSteamId('')
      setPlayerName('')
      setWager('')
      
      alert('✅ Match created! Waiting for opponent...')
    } catch (error: any) {
      setError(error.message || 'Failed to create match')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinMatch = async (match: CSGOMatchProps) => {
    if (!username) {
      setError('Please enter your username first')
      return
    }

    if (match.creator.username === username) {
      setError('You cannot join your own match!')
      return
    }

    const joinerSteamId = prompt(`Enter your Steam ID (17-digit number or custom URL):`)
    if (!joinerSteamId) return

    const joinerName = prompt(`Enter your display name (optional):`) || ''

    setLoading(true)
    setError('')

    try {
      await joinCSGOMatch(match.id, username, joinerSteamId, joinerName || undefined)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-yellow-800 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-400 to-yellow-500 p-3 rounded-lg">
              <span className="text-2xl">🔫</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Counter-Strike: Global Offensive</h1>
              <p className="text-xs text-orange-300">Tactical • Competitive • Intense</p>
            </div>
          </div>
          <a href="/" className="text-sm text-orange-300 hover:text-orange-200">
            ← Back to Games
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-400/30 rounded-xl p-6 mb-8">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span>ℹ️</span> How It Works
          </h2>
          <ol className="space-y-2 text-sm text-orange-100 list-decimal list-inside">
            <li>Create a match with your <strong>Steam ID</strong> and wager amount</li>
            <li>Wait for an opponent to join with their Steam ID</li>
            <li>Play CS:GO matches (Competitive, Wingman, or Casual) - track your performance!</li>
            <li>Winner determined by <strong>performance improvement</strong> (wins, K/D ratio, MVPs)</li>
            <li>Automatic detection via Steam API!</li>
          </ol>
          <div className="mt-4 bg-orange-900/30 border border-orange-500/30 rounded-lg p-3">
            <p className="text-sm font-semibold text-orange-200">💡 Finding Your Steam ID:</p>
            <p className="text-xs text-orange-300 mt-1">
              <strong>Method 1:</strong> Your profile URL: <code className="bg-black/30 px-1 rounded">steamcommunity.com/profiles/[YOUR_17_DIGIT_ID]</code><br/>
              <strong>Method 2:</strong> Custom URL: <code className="bg-black/30 px-1 rounded">steamcommunity.com/id/[YOUR_CUSTOM_URL]</code><br/>
              <strong>Method 3:</strong> Use: <a href="https://steamid.io/" target="_blank" className="text-blue-400 hover:underline">SteamID.io</a> to find it<br/>
              <strong>IMPORTANT:</strong> Your Steam profile must be PUBLIC!
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">❌ {error}</p>
            <button onClick={() => setError('')} className="text-xs text-red-300 hover:text-red-200 mt-2">Dismiss</button>
          </div>
        )}

        {/* Create Match Form */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">🎯 Create Match</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Steam ID <span className="text-xs text-orange-300">(17 digits or custom URL)</span>
              </label>
              <input
                type="text"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="e.g., 76561198012345678"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
              />
              <p className="text-xs text-orange-300 mt-1">
                💡 Find it at steamid.io or your profile URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Display Name <span className="text-xs text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your CS:GO name"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
              />
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
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
              />
              <p className="text-xs text-orange-300 mt-1">
                Winner gets {wager ? (parseFloat(wager) * 1.95).toFixed(2) : '0.00'} SOL (5% fee)
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateMatch}
            disabled={loading || !username || !steamId}
            className="mt-6 w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:from-gray-500 disabled:to-gray-600 px-6 py-3 rounded-lg font-bold disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Creating...' : '✨ Create Match'}
          </button>
        </div>

        {/* Open Matches */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">🟢 Available Matches</h2>
            <button
              onClick={loadAllMatches}
              className="text-sm text-orange-300 hover:text-orange-200"
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
                          <span className="text-2xl">💥</span>
                          <div>
                            <p className="font-bold text-lg">
                              {isMyMatch ? '👤 Your Match' : match.creator.username}
                            </p>
                            <p className="text-sm text-gray-400">
                              {match.summonerName1 || 'CS:GO Player'} • {getTimeSince(match.createdAt)}
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

        {/* Playing Matches */}
        {playingMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">🎮 Games in Progress</h2>
            <div className="space-y-4">
              {playingMatches.map((match) => {
                const isParticipant = match.creator.username === username || match.joiner?.username === username

                return (
                  <div
                    key={match.id}
                    className={`bg-white/5 border rounded-xl p-6 ${
                      isParticipant ? 'border-orange-400/50 bg-orange-500/10' : 'border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-xl mb-2">
                          {match.summonerName1} vs {match.summonerName2}
                        </p>
                        <div className="flex gap-2 text-sm">
                          <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full">
                            🎮 Playing
                          </span>
                          <span className="text-gray-400">CS:GO</span>
                        </div>
                      </div>
                    </div>

                    {isParticipant && (
                      <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4 mt-4">
                        <p className="font-bold mb-3 text-orange-300">📋 Instructions:</p>
                        <ol className="space-y-2 text-sm list-decimal list-inside">
                          <li>Open CS:GO / CS2</li>
                          <li>Add opponent as Steam friend: <strong>Steam ID: {match.creator.username === username ? match.summonerPuuid2 : match.summonerPuuid1}</strong></li>
                          <li>Play matches together (Competitive, Wingman, or Casual)</li>
                          <li><strong>IMPORTANT:</strong> Make sure your Steam profile is PUBLIC!</li>
                          <li>Play multiple rounds - winner determined by overall performance improvement</li>
                          <li>Stats checked every 15 seconds via Steam API ⏱️</li>
                        </ol>
                        <div className="mt-3 bg-yellow-900/40 border border-yellow-500/30 rounded p-3">
                          <p className="text-xs text-yellow-200">
                            💡 <strong>Performance Tracking:</strong> Winner is determined by who improves their stats the most (wins, K/D, MVPs). Play at least 1-2 competitive matches for best results!
                          </p>
                        </div>
                        <div className="mt-3 bg-red-900/40 border border-red-500/30 rounded p-3">
                          <p className="text-xs text-red-200">
                            ⚠️ <strong>Privacy Settings:</strong> Go to Steam → Profile → Edit Profile → Privacy Settings → Set "Game Details" to PUBLIC
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Finished Matches */}
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
                        {isDraw ? '🤝 Draw (Equal Performance)' : '🏆 Winner'}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className={`flex-1 text-center p-3 rounded ${creatorWon ? 'bg-green-500/20' : 'bg-gray-800/30'}`}>
                          <p className={`font-bold ${creatorWon ? 'text-green-300' : 'text-gray-400'}`}>
                            {creatorWon && '👑 '}
                            {match.summonerName1}
                          </p>
                          <p className="text-xs text-gray-500">{match.creator.username}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            <a 
                              href={`https://steamcommunity.com/profiles/${match.summonerPuuid1}`} 
                              target="_blank" 
                              className="hover:text-blue-400"
                            >
                              Steam Profile →
                            </a>
                          </p>
                        </div>
                        <span className="px-4 text-gray-500">VS</span>
                        <div className={`flex-1 text-center p-3 rounded ${joinerWon ? 'bg-green-500/20' : 'bg-gray-800/30'}`}>
                          <p className={`font-bold ${joinerWon ? 'text-green-300' : 'text-gray-400'}`}>
                            {joinerWon && '👑 '}
                            {match.summonerName2}
                          </p>
                          <p className="text-xs text-gray-500">{match.joiner?.username}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            <a 
                              href={`https://steamcommunity.com/profiles/${match.summonerPuuid2}`} 
                              target="_blank" 
                              className="hover:text-blue-400"
                            >
                              Steam Profile →
                            </a>
                          </p>
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