"use client"
import { useState, useEffect } from "react"
import { 
  createPUBGMatch, 
  joinPUBGMatch, 
  getOpenPUBGMatches, 
  getAllPUBGMatches,
  getPUBGMatchById,
  checkPUBGMatchResult,
  getPUBGPlayerCurrentStats
} from "@/lib/server-action/mian"
import WalletButton, { useJoinMatchWithEscrow, useMatchCreationWithEscrow } from "@/components/wallet-button"
import { capturePlayerStatsSnapshot, getPlayerByName } from "@/lib/server-action/pubg-api"

interface PUBGMatchProps {
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
  region?: string | null
  status: 'WAITING' | 'PLAYING' | 'FINISHED' | 'CANCELLED'
  winner?: 'CREATOR' | 'JOINER' | 'DRAW' | null
  wager: number
  createdAt: Date
  statsSnapshotBefore?: any
  statsSnapshotAfter?: any
}

export default function PUBGPage() {
  const [username, setUsername] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [platform, setPlatform] = useState<'steam' | 'kakao' | 'psn' | 'xbox' | 'stadia'>('steam')
  const [wager, setWager] = useState('')
  
  const [openMatches, setOpenMatches] = useState<PUBGMatchProps[]>([])
  const [playingMatches, setPlayingMatches] = useState<PUBGMatchProps[]>([])
  const [finishedMatches, setFinishedMatches] = useState<PUBGMatchProps[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [myActiveMatches, setMyActiveMatches] = useState<string[]>([])

  const {createMatch , loading: creatingMatch} = useMatchCreationWithEscrow()
  const {joinMatch , loading:joiningMatch} = useJoinMatchWithEscrow()

  useEffect(() => {
    loadAllMatches()
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      await checkPUBGMatchResult()
      await loadAllMatches()
    }, 15000) // Check every 15 seconds

    return () => clearInterval(interval)
  }, [myActiveMatches])

  const loadAllMatches = async () => {
    try {
      const allMatches = await getAllPUBGMatches() as any[]
      
      setOpenMatches(allMatches.filter(m => m.status === 'WAITING'))
      setPlayingMatches(allMatches.filter(m => m.status === 'PLAYING'))
      setFinishedMatches(allMatches.filter(m => m.status === 'FINISHED'))
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  const handleCreateMatch = async () => {
    if (!username || !playerName) {
      setError('Please enter username and player name')
      return
    }

    setLoading(true)
    setError('')
    
    try {
    const player = await getPlayerByName(playerName, platform)
    if (!player) {
      throw new Error('Player not found. Check your player name and platform.')
    }

    const initialStats = await capturePlayerStatsSnapshot(player.id, platform)
    if (!initialStats) {
      throw new Error('Failed to capture player stats. Player may have no recent matches.')
    }

    const result = await createMatch(
      username,
      'PUBG_PC',
      parseFloat(wager),
      {
        summonerName1: playerName,
        summonerPuuid1: player.id,
        region: platform,
        statsSnapshotBefore: {
          player1: initialStats,
          timestamp: Date.now(),
          platform: platform
        } as any
      }
    )

    if (result.success && result.match) {
      setMyActiveMatches(prev => [...prev, result.match.id])
      await loadAllMatches()
      
      setPlayerName('')
      setWager('')
      
      alert(`✅ Match created with ${wager} SOL in escrow! Waiting for opponent...`)
    } else {
      throw new Error(result.error || 'Failed to create match')
    }
  } catch (error: any) {
    setError(error.message || 'Failed to create match')
    alert(`❌ ${error.message}`)
  } finally {
    setLoading(false)
  }
}

const handleJoinMatch = async (match: PUBGMatchProps) => {
  if (!username) {
    setError('Please enter your username first')
    return
  }

  if (match.creator.username === username) {
    setError('You cannot join your own match!')
    return
  }

  const joinerPlayerName = prompt(`Enter your PUBG Player Name:`)
  if (!joinerPlayerName) return

  setLoading(true)
  setError('')

  try {
    const matchPlatform = (match.region as 'steam' | 'kakao' | 'psn' | 'xbox' | 'stadia') || 'steam'

    // Step 1: Get joiner's player data
    const player = await getPlayerByName(joinerPlayerName, matchPlatform)
    if (!player) {
      throw new Error('Player not found. Check your player name.')
    }

    // Step 2: Capture joiner's initial stats
    const initialStats = await capturePlayerStatsSnapshot(player.id, matchPlatform)
    if (!initialStats) {
      throw new Error('Failed to capture player stats. Player may have no recent matches.')
    }

    // Step 3: Get the existing snapshot (it's already an object from DB)
    const existingSnapshot = match.statsSnapshotBefore as any || {}

    // Step 4: Join match with escrow using the hook
    const result = await joinMatch(
      match.id,
      username,
      match.wager, // Must match the creator's wager
      {
        summonerName2: joinerPlayerName,
        summonerPuuid2: player.id,
        statsSnapshotBefore: {
          player1: existingSnapshot.player1 || existingSnapshot,
          player2: initialStats,
          timestamp: Date.now(),
          platform: matchPlatform
        }
      }
    )

    if (result.success && result.match) {
      setMyActiveMatches(prev => [...prev, match.id])
      await loadAllMatches()
      alert(`✅ Joined match with ${match.wager} SOL in escrow! Start playing PUBG!`)
    } else {
      throw new Error(result.error || 'Failed to join match')
    }
  } catch (error: any) {
    setError(error.message || 'Failed to join match')
    alert(`❌ ${error.message}`)
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

  const getPlatformDisplay = (region?: string | null) => {
    const platforms: Record<string, string> = {
      steam: '🖥️ PC (Steam)',
      kakao: '🖥️ PC (Kakao)',
      psn: '🎮 PlayStation',
      xbox: '🎮 Xbox',
      stadia: '🎮 Stadia'
    }
    return platforms[region || 'steam'] || region
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-700 via-orange-600 to-yellow-600 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-lg">
        <span className="text-2xl">🎯</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold">PUBG: BATTLEGROUNDS</h1>
        <p className="text-xs text-amber-200">Battle Royale • Survival • Winner Winner</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <WalletButton />
      <a href="/" className="text-sm text-amber-200 hover:text-white">
        ← Back
      </a>
    </div>
  </div>
</header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-xl p-6 mb-8">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span>ℹ️</span> How PUBG Wagering Works
          </h2>
          <ol className="space-y-2 text-sm text-amber-100 list-decimal list-inside">
            <li>Create a match with your <strong>PUBG Player Name</strong> and platform</li>
            <li>Wait for an opponent to join</li>
            <li>Both players play PUBG matches on their chosen platform</li>
            <li>Winner determined by: <strong>Most Wins → Most Kills → Most Damage</strong></li>
            <li>System tracks your last 10 matches automatically</li>
            <li>Winner gets the prize pool! 🎯</li>
          </ol>
          <div className="mt-4 bg-amber-900/30 border border-amber-500/30 rounded-lg p-3">
            <p className="text-sm font-semibold text-amber-200">💡 How Stats Are Tracked:</p>
            <p className="text-xs text-amber-300 mt-1">
              • We compare your stats BEFORE and AFTER the match<br/>
              • Play as many PUBG matches as you want during the competition<br/>
              • Winner = Most Chicken Dinners (Wins) → Kills → Damage<br/>
              • Stats are checked every 15 seconds automatically
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
          <h2 className="text-2xl font-bold mb-6">🎯 Create PUBG Match</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                PUBG Player Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your PUBG name"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
              />
              <p className="text-xs text-amber-300 mt-1">
                💡 Exact in-game name (case-sensitive)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
              >
                <option value="steam">🖥️ PC (Steam)</option>
                <option value="kakao">🖥️ PC (Kakao)</option>
                <option value="psn">🎮 PlayStation</option>
                <option value="xbox">🎮 Xbox</option>
                <option value="stadia">🎮 Stadia</option>
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
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
              />
              <p className="text-xs text-amber-300 mt-1">
                Winner gets {wager ? (parseFloat(wager) * 1.95).toFixed(2) : '0.00'} SOL (5% fee)
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateMatch}
            disabled={loading || !username || !playerName}
            className="mt-6 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 px-6 py-3 rounded-lg font-bold disabled:cursor-not-allowed"
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
              className="text-sm text-amber-300 hover:text-amber-200"
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
                      isMyMatch ? 'border-amber-400/50 bg-amber-500/10' : 'border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">🎯</span>
                          <div>
                            <p className="font-bold text-lg">
                              {isMyMatch ? '👤 Your Match' : match.creator.username}
                            </p>
                            <p className="text-sm text-gray-400">
                              {match.summonerName1} • {getPlatformDisplay(match.region)} • {getTimeSince(match.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">
                            💰 {match.wager} SOL wager
                          </span>
                          {isMyMatch && (
                            <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full animate-pulse">
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
            <h2 className="text-2xl font-bold mb-4">⚔️ Matches in Progress</h2>
            <div className="space-y-4">
              {playingMatches.map((match) => {
                const isParticipant = match.creator.username === username || match.joiner?.username === username

                return (
                  <div
                    key={match.id}
                    className={`bg-white/5 border rounded-xl p-6 ${
                      isParticipant ? 'border-amber-400/50 bg-amber-500/10' : 'border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-xl mb-2">
                          {match.summonerName1} vs {match.summonerName2}
                        </p>
                        <div className="flex gap-2 text-sm">
                          <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full">
                            🎯 Playing
                          </span>
                          <span className="text-gray-400">{getPlatformDisplay(match.region)}</span>
                        </div>
                      </div>
                    </div>

                    {isParticipant && (
                      <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-4 mt-4">
                        <p className="font-bold mb-3 text-amber-300">📋 Competition Instructions:</p>
                        <ol className="space-y-2 text-sm list-decimal list-inside">
                          <li>Launch PUBG on your platform ({getPlatformDisplay(match.region)})</li>
                          <li>Play as many matches as you want (Solo, Duo, or Squad)</li>
                          <li>Try to get Chicken Dinners (1st place wins)! 🍗</li>
                          <li>Get as many kills and damage as possible</li>
                          <li>Winner determined by: Wins → Kills → Damage</li>
                          <li>Stats auto-update every 15 seconds! ⏱️</li>
                        </ol>
                        <div className="mt-3 bg-yellow-900/40 border border-yellow-500/30 rounded p-3">
                          <p className="text-xs text-yellow-200">
                            💡 <strong>Tip:</strong> Your last 10 matches are tracked. Play strategically to maximize wins!
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
                const afterStats = match.statsSnapshotAfter

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
                        <p className="text-xs text-gray-400 mt-1">{getPlatformDisplay(match.region)}</p>
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
                          {afterStats?.differences?.player1 && (
                            <div className="text-xs mt-2 space-y-1">
                              <p className="text-green-400">🏆 Wins: {afterStats.differences.player1.wins}</p>
                              <p className="text-red-400">💀 Kills: {afterStats.differences.player1.kills}</p>
                              <p className="text-orange-400">💥 Damage: {afterStats.differences.player1.damage.toFixed(0)}</p>
                            </div>
                          )}
                        </div>
                        <span className="px-4 text-gray-500">VS</span>
                        <div className={`flex-1 text-center p-3 rounded ${joinerWon ? 'bg-green-500/20' : 'bg-gray-800/30'}`}>
                          <p className={`font-bold ${joinerWon ? 'text-green-300' : 'text-gray-400'}`}>
                            {joinerWon && '👑 '}
                            {match.summonerName2}
                          </p>
                          <p className="text-xs text-gray-500">{match.joiner?.username}</p>
                          {afterStats?.differences?.player2 && (
                            <div className="text-xs mt-2 space-y-1">
                              <p className="text-green-400">🏆 Wins: {afterStats.differences.player2.wins}</p>
                              <p className="text-red-400">💀 Kills: {afterStats.differences.player2.kills}</p>
                              <p className="text-orange-400">💥 Damage: {afterStats.differences.player2.damage.toFixed(0)}</p>
                            </div>
                          )}
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