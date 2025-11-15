"use client"
import { useState, useEffect } from "react"
import { 
  createClanWarMatch, 
  joinClanWarMatch, 
  getOpenClanWarMatches, 
  getAllClanWarMatches,
  getClanWarMatchById,
  getClanWarStatus,
  checkClanWarMatchResult
} from "@/lib/server-action/mian"

interface ClanWarMatchProps {
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

const  ClashOfClansPage = () => {
  const [username, setUsername] = useState('')
  const [clanTag, setClanTag] = useState('')
  const [clanName, setClanName] = useState('')
  const [wager, setWager] = useState('')
  
  const [openMatches, setOpenMatches] = useState<ClanWarMatchProps[]>([])
  const [playingMatches, setPlayingMatches] = useState<ClanWarMatchProps[]>([])
  const [finishedMatches, setFinishedMatches] = useState<ClanWarMatchProps[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [myActiveMatches, setMyActiveMatches] = useState<string[]>([])
  const [warStatuses, setWarStatuses] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    loadAllMatches()
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      await checkClanWarMatchResult()
      
      // Update war statuses for active matches
      for (const matchId of myActiveMatches) {
        const warStatus = await getClanWarStatus(matchId)
        if (warStatus) {
          setWarStatuses(prev => new Map(prev).set(matchId, warStatus))
        }
      }
      
      await loadAllMatches()
    }, 30000) // Check every 30 seconds (wars last 24-48 hours)

    return () => clearInterval(interval)
  }, [myActiveMatches])

  const loadAllMatches = async () => {
    try {
      const allMatches = await getAllClanWarMatches() as any[]
      
      setOpenMatches(allMatches.filter(m => m.status === 'WAITING'))
      setPlayingMatches(allMatches.filter(m => m.status === 'PLAYING'))
      setFinishedMatches(allMatches.filter(m => m.status === 'FINISHED'))
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  const handleCreateMatch = async () => {
    if (!username || !clanTag) {
      setError('Please enter username and clan tag')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const match = await createClanWarMatch(username, clanTag, clanName || undefined)
      
      setMyActiveMatches(prev => [...prev, (match as any).id])
      
      await loadAllMatches()
      
      setClanTag('')
      setClanName('')
      setWager('')
      
      alert('✅ Clan War match created! Waiting for opponent clan...')
    } catch (error: any) {
      setError(error.message || 'Failed to create match')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinMatch = async (match: ClanWarMatchProps) => {
    if (!username) {
      setError('Please enter your username first')
      return
    }

    if (match.creator.username === username) {
      setError('You cannot join your own match!')
      return
    }

    const joinerClanTag = prompt(`Enter your Clan Tag (e.g., #ABC123XYZ):`)
    if (!joinerClanTag) return

    const joinerClanName = prompt(`Enter clan display name (optional):`) || ''

    setLoading(true)
    setError('')

    try {
      await joinClanWarMatch(match.id, username, joinerClanTag, joinerClanName || undefined)
      setMyActiveMatches(prev => [...prev, match.id])
      await loadAllMatches()
      alert('✅ Clans matched! Start your clan war now!')
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
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 via-yellow-600 to-amber-700 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-yellow-500 p-3 rounded-lg">
              <span className="text-2xl">⚔️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Clash of Clans</h1>
              <p className="text-xs text-orange-200">Clan Wars • Strategy • Domination</p>
            </div>
          </div>
          <a href="/" className="text-sm text-orange-200 hover:text-white">
            ← Back to Games
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-400/30 rounded-xl p-6 mb-8">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span>ℹ️</span> How Clan Wars Wagering Works
          </h2>
          <ol className="space-y-2 text-sm text-orange-100 list-decimal list-inside">
            <li>Clan leader creates a match with <strong>Clan Tag</strong> and wager amount</li>
            <li>Opponent clan leader joins with their Clan Tag</li>
            <li>Both clans start an <strong>official Clan War</strong> against each other</li>
            <li>War runs for 24-48 hours (Preparation + Battle Day)</li>
            <li>After war ends, winner is automatically determined: <strong>Stars → Destruction %</strong></li>
            <li>Winning clan members split the prize pool!</li>
          </ol>
          <div className="mt-4 bg-orange-900/30 border border-orange-500/30 rounded-lg p-3">
            <p className="text-sm font-semibold text-orange-200">⚠️ Important Requirements:</p>
            <p className="text-xs text-orange-300 mt-1">
              • Both clans must have <strong>PUBLIC war log</strong> (Settings → War Log → Public)<br/>
              • Start war AFTER both clans have joined the match<br/>
              • Winner determined by: Total Stars → Destruction Percentage<br/>
              • Find your clan tag: Open game → Clan → Info (top right)
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
          <h2 className="text-2xl font-bold mb-6">⚔️ Create Clan War Match</h2>
          
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
                Clan Tag <span className="text-xs text-orange-300">(e.g., #ABC123XYZ)</span>
              </label>
              <input
                type="text"
                value={clanTag}
                onChange={(e) => setClanTag(e.target.value)}
                placeholder="#ABC123XYZ"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
              />
              <p className="text-xs text-orange-300 mt-1">
                💡 Find in-game: Clan → Info (top right)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Clan Name <span className="text-xs text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={clanName}
                onChange={(e) => setClanName(e.target.value)}
                placeholder="Your clan name"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Total Prize Pool (SOL)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={wager}
                onChange={(e) => setWager(e.target.value)}
                placeholder="10.0"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
              />
              <p className="text-xs text-orange-300 mt-1">
                Each clan contributes {wager ? (parseFloat(wager) / 2).toFixed(2) : '0.00'} SOL
              </p>
              <p className="text-xs text-yellow-300 mt-1">
                Winning clan gets {wager ? (parseFloat(wager) * 0.95).toFixed(2) : '0.00'} SOL (5% fee)
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateMatch}
            disabled={loading || !username || !clanTag}
            className="mt-6 w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:from-gray-500 disabled:to-gray-600 px-6 py-3 rounded-lg font-bold disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Creating...' : '✨ Create Clan War Match'}
          </button>
        </div>

        {/* Open Matches */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">🟢 Available Clan Wars</h2>
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
                <p className="text-gray-400">No clan wars available. Create one!</p>
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
                          <span className="text-2xl">🏰</span>
                          <div>
                            <p className="font-bold text-lg">
                              {isMyMatch ? '👤 Your Clan War' : match.creator.username}
                            </p>
                            <p className="text-sm text-gray-400">
                              {match.summonerName1 || 'Clan'} • {match.summonerPuuid1} • {getTimeSince(match.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">
                            💰 {match.wager} SOL total pool
                          </span>
                          {isMyMatch && (
                            <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full animate-pulse">
                              ⏳ Waiting for opponent clan...
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
                          ⚡ Join War
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
            <h2 className="text-2xl font-bold mb-4">⚔️ Wars in Progress</h2>
            <div className="space-y-4">
              {playingMatches.map((match) => {
                const isParticipant = match.creator.username === username || match.joiner?.username === username
                const warStatus = warStatuses.get(match.id)

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
                          {match.summonerName1 || 'Clan 1'} vs {match.summonerName2 || 'Clan 2'}
                        </p>
                        <div className="flex gap-2 text-sm">
                          <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full">
                            ⚔️ War Active
                          </span>
                          <span className="text-gray-400">
                            {match.summonerPuuid1} vs {match.summonerPuuid2}
                          </span>
                        </div>
                      </div>
                    </div>

                    {warStatus && (
                      <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4 mb-4">
                        <p className="font-bold mb-2 text-orange-300">📊 War Status:</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">State:</p>
                            <p className="font-semibold">{warStatus.state}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Time Remaining:</p>
                            <p className="font-semibold">{warStatus.endTime ? new Date(warStatus.endTime).toLocaleString() : 'TBD'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isParticipant && (
                      <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4 mt-4">
                        <p className="font-bold mb-3 text-orange-300">📋 War Instructions:</p>
                        <ol className="space-y-2 text-sm list-decimal list-inside">
                          <li>Open Clash of Clans</li>
                          <li>Your clan: <strong className="text-yellow-300">{match.creator.username === username ? match.summonerPuuid1 : match.summonerPuuid2}</strong></li>
                          <li>Opponent clan: <strong className="text-yellow-300">{match.creator.username === username ? match.summonerPuuid2 : match.summonerPuuid1}</strong></li>
                          <li>Start a Clan War and search for opponent</li>
                          <li>War lasts 24-48 hours (Prep Day + Battle Day)</li>
                          <li>Winner detected automatically! ⏱️ Checking every 30s...</li>
                        </ol>
                        <div className="mt-3 bg-yellow-900/40 border border-yellow-500/30 rounded p-3">
                          <p className="text-xs text-yellow-200">
                            💡 <strong>Remember:</strong> Both clans must have PUBLIC war logs enabled for automatic winner detection!
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
            <h2 className="text-2xl font-bold mb-4">🏆 Completed Wars</h2>
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
                          {match.summonerName1 || 'Clan 1'} vs {match.summonerName2 || 'Clan 2'}
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
                            {match.summonerName1 || 'Clan 1'}
                          </p>
                          <p className="text-xs text-gray-500">{match.creator.username}</p>
                          <p className="text-xs text-gray-400 mt-1">{match.summonerPuuid1}</p>
                        </div>
                        <span className="px-4 text-gray-500">VS</span>
                        <div className={`flex-1 text-center p-3 rounded ${joinerWon ? 'bg-green-500/20' : 'bg-gray-800/30'}`}>
                          <p className={`font-bold ${joinerWon ? 'text-green-300' : 'text-gray-400'}`}>
                            {joinerWon && '👑 '}
                            {match.summonerName2 || 'Clan 2'}
                          </p>
                          <p className="text-xs text-gray-500">{match.joiner?.username}</p>
                          <p className="text-xs text-gray-400 mt-1">{match.summonerPuuid2}</p>
                        </div>
                      </div>
                      {!isDraw && (
                        <p className="text-center text-green-400 font-semibold mt-3">
                          💰 Payout: {(match.wager * 0.95).toFixed(2)} SOL
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

export default ClashOfClansPage