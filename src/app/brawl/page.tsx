"use client"
import { useState, useEffect } from "react"
import { 
  CreateBrawlStarsMatch, 
  joinBrawlStarsMatch, 
  getOpenBrawlStarsMatches, 
  getAllBrawlStarsMatches,
  getBrawlStarsMatchById,
  checkAndUpdateGameResults 
} from "../../lib/server-action/mian"

interface BrawlStarsMatchProps {
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

const  BrawlStarsPage = () => {
  const [username, setUsername] = useState('')
  const [playerTag, setPlayerTag] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [wager, setWager] = useState('')
  
  const [openMatches, setOpenMatches] = useState<BrawlStarsMatchProps[]>([])
  const [playingMatches, setPlayingMatches] = useState<BrawlStarsMatchProps[]>([])
  const [finishedMatches, setFinishedMatches] = useState<BrawlStarsMatchProps[]>([])
  
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
        const currentMatch = await getBrawlStarsMatchById(matchId)
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
      const allMatches = await getAllBrawlStarsMatches() as any[]
      
      setOpenMatches(allMatches.filter(m => m.status === 'WAITING'))
      setPlayingMatches(allMatches.filter(m => m.status === 'PLAYING'))
      setFinishedMatches(allMatches.filter(m => m.status === 'FINISHED'))
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  const handleCreateMatch = async () => {
    if (!username || !playerTag) {
      setError('Please enter username and player tag')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const match = await CreateBrawlStarsMatch(username, playerTag, playerName || undefined)
      
      setMyActiveMatches(prev => [...prev, (match as any).id])
      setPreviousMatchStates(prev => new Map(prev).set((match as any).id, 'WAITING'))
      
      await loadAllMatches()
      
      setPlayerTag('')
      setPlayerName('')
      setWager('')
      
      alert('✅ Match created! Waiting for opponent...')
    } catch (error: any) {
      setError(error.message || 'Failed to create match')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinMatch = async (match: BrawlStarsMatchProps) => {
    if (!username) {
      setError('Please enter your username first')
      return
    }

    if (match.creator.username === username) {
      setError('You cannot join your own match!')
      return
    }

    const joinerTag = prompt(`Enter your Brawl Stars Player Tag (e.g., #ABC123XYZ):`)
    if (!joinerTag) return

    const joinerName = prompt(`Enter your display name (optional):`) || ''

    setLoading(true)
    setError('')

    try {
      await joinBrawlStarsMatch(match.id, username, joinerTag, joinerName || undefined)
      await loadAllMatches()
      alert('✅ Match joined! Go brawl!')
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-yellow-500 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-lg">
              <span className="text-2xl">🌟</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Brawl Stars</h1>
              <p className="text-xs text-yellow-200">Fast-Paced • 3v3 • Action</p>
            </div>
          </div>
          <a href="/" className="text-sm text-yellow-200 hover:text-white">
            ← Back to Games
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-purple-500/20 to-yellow-500/20 border border-purple-400/30 rounded-xl p-6 mb-8">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span>ℹ️</span> How It Works
          </h2>
          <ol className="space-y-2 text-sm text-purple-100 list-decimal list-inside">
            <li>Create a match with your <strong>Player Tag</strong> and wager amount</li>
            <li>Wait for an opponent to join with their Player Tag</li>
            <li>Both players battle each other in Brawl Stars (3v3, Duo Showdown, or Friendly Game)</li>
            <li>Winner is automatically detected from battle log!</li>
            <li>Instant payout to winner's wallet!</li>
          </ol>
          <div className="mt-4 bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
            <p className="text-sm font-semibold text-purple-200">💡 Finding Your Player Tag:</p>
            <p className="text-xs text-purple-300 mt-1">
              1. Open Brawl Stars<br/>
              2. Tap your profile (top left)<br/>
              3. Your Player Tag is shown (e.g., #ABC123XYZ)<br/>
              4. Tap to copy!
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
          <h2 className="text-2xl font-bold mb-6">🌟 Create Match</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Player Tag <span className="text-xs text-yellow-300">(e.g., #ABC123XYZ)</span>
              </label>
              <input
                type="text"
                value={playerTag}
                onChange={(e) => setPlayerTag(e.target.value)}
                placeholder="#ABC123XYZ"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500"
              />
              <p className="text-xs text-yellow-300 mt-1">
                💡 Find in-game: Profile → Player Tag
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
                placeholder="Your Brawl Stars name"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500"
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
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-500"
              />
              <p className="text-xs text-yellow-300 mt-1">
                Winner gets {wager ? (parseFloat(wager) * 1.95).toFixed(2) : '0.00'} SOL (5% fee)
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateMatch}
            disabled={loading || !username || !playerTag}
            className="mt-6 w-full bg-gradient-to-r from-purple-500 to-yellow-500 hover:from-purple-600 hover:to-yellow-600 disabled:from-gray-500 disabled:to-gray-600 px-6 py-3 rounded-lg font-bold disabled:cursor-not-allowed"
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
              className="text-sm text-yellow-300 hover:text-yellow-200"
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
                      isMyMatch ? 'border-yellow-400/50 bg-yellow-500/10' : 'border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">⭐</span>
                          <div>
                            <p className="font-bold text-lg">
                              {isMyMatch ? '👤 Your Match' : match.creator.username}
                            </p>
                            <p className="text-sm text-gray-400">
                              {match.summonerName1} • {match.summonerPuuid1} • {getTimeSince(match.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">
                            💰 {match.wager} SOL wager
                          </span>
                          {isMyMatch && (
                            <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full animate-pulse">
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
                          ⚡ Join & Brawl
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
            <h2 className="text-2xl font-bold mb-4">⚔️ Brawls in Progress</h2>
            <div className="space-y-4">
              {playingMatches.map((match) => {
                const isParticipant = match.creator.username === username || match.joiner?.username === username

                return (
                  <div
                    key={match.id}
                    className={`bg-white/5 border rounded-xl p-6 ${
                      isParticipant ? 'border-purple-400/50 bg-purple-500/10' : 'border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-xl mb-2">
                          {match.summonerName1} vs {match.summonerName2}
                        </p>
                        <div className="flex gap-2 text-sm">
                          <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
                            ⚔️ Brawling
                          </span>
                          <span className="text-gray-400">Brawl Stars</span>
                        </div>
                      </div>
                    </div>

                    {isParticipant && (
                      <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mt-4">
                        <p className="font-bold mb-3 text-purple-300">📋 Instructions:</p>
                        <ol className="space-y-2 text-sm list-decimal list-inside">
                          <li>Open Brawl Stars on your device</li>
                          <li>Add opponent as friend using their Player Tag: <strong>{match.creator.username === username ? match.summonerPuuid2 : match.summonerPuuid1}</strong></li>
                          <li>Create a Friendly Game room or play any 3v3 mode</li>
                          <li><strong>IMPORTANT: Must be on OPPOSITE teams!</strong></li>
                          <li>Battle it out! Winner detected automatically from battle log ⏱️</li>
                        </ol>
                        <div className="mt-3 bg-orange-900/40 border border-orange-500/30 rounded p-3">
                          <p className="text-xs text-orange-200">💡 <strong>Tip:</strong> Easiest way is Friendly Game mode! Make sure you&apso;re on opposite teams. System checks battle logs every 10 seconds.</p>
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
                        {isDraw ? '🤝 Draw (Same Team)' : '🏆 Winner'}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className={`flex-1 text-center p-3 rounded ${creatorWon ? 'bg-green-500/20' : 'bg-gray-800/30'}`}>
                          <p className={`font-bold ${creatorWon ? 'text-green-300' : 'text-gray-400'}`}>
                            {creatorWon && '👑 '}
                            {match.summonerName1}
                          </p>
                          <p className="text-xs text-gray-500">{match.creator.username}</p>
                          <p className="text-xs text-gray-400 mt-1">Tag: {match.summonerPuuid1}</p>
                        </div>
                        <span className="px-4 text-gray-500">VS</span>
                        <div className={`flex-1 text-center p-3 rounded ${joinerWon ? 'bg-green-500/20' : 'bg-gray-800/30'}`}>
                          <p className={`font-bold ${joinerWon ? 'text-green-300' : 'text-gray-400'}`}>
                            {joinerWon && '👑 '}
                            {match.summonerName2}
                          </p>
                          <p className="text-xs text-gray-500">{match.joiner?.username}</p>
                          <p className="text-xs text-gray-400 mt-1">Tag: {match.summonerPuuid2}</p>
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

export default BrawlStarsPage