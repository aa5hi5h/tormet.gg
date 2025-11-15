"use client"
import { useState, useEffect } from "react"
import { 
  createRocketLeagueMatch, 
  joinRocketLeagueMatch, 
  getOpenRocketLeagueMatches, 
  getAllRocketLeagueMatches,
  getRocketLeagueMatchById,
  submitRocketLeagueMatchResult,
} from "../../../lib/server-action/mian"

interface RocketLeagueMatchProps {
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
  platform1?: string | null
  platform2?: string | null
  beforeSnapshot1: string | null
  beforeSnapshot2: string | null
  afterSnapshot1: string | null
  afterSnapshot2: string | null
  status: 'WAITING' | 'PLAYING' | 'FINISHED' | 'CANCELLED'
  winner?: 'CREATOR' | 'JOINER' | 'DRAW' | null
  wager: number
  createdAt: Date
  startedAt?: Date | null
}

const RocketLeaguePage = () => {
  const [username, setUsername] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [platform, setPlatform] = useState('steam')
  const [wager, setWager] = useState('')
  
  const [openMatches, setOpenMatches] = useState<RocketLeagueMatchProps[]>([])
  const [playingMatches, setPlayingMatches] = useState<RocketLeagueMatchProps[]>([])
  const [finishedMatches, setFinishedMatches] = useState<RocketLeagueMatchProps[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [myActiveMatches, setMyActiveMatches] = useState<string[]>([])

  useEffect(() => {
    loadAllMatches()
  }, [])

  const loadAllMatches = async () => {
    try {
      const allMatches = await getAllRocketLeagueMatches() as any[]
      
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
      const match = await createRocketLeagueMatch(username, playerName, platform)
      
      setMyActiveMatches(prev => [...prev, (match as any).id])
      
      await loadAllMatches()
      
      setPlayerName('')
      setWager('')
      
      alert('✅ Match created! Waiting for opponent...')
    } catch (error: any) {
      setError(error.message || 'Failed to create match')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinMatch = async (match: RocketLeagueMatchProps) => {
    if (!username) {
      setError('Please enter your username first')
      return
    }

    if (match.creator.username === username) {
      setError('You cannot join your own match!')
      return
    }

    const joinerPlayerName = prompt(`Enter your Rocket League username:`)
    if (!joinerPlayerName) return

    const joinerPlatform = prompt(`Enter your platform (steam/psn/xbl/epic/switch):`, 'steam') || 'steam'

    setLoading(true)
    setError('')

    try {
      await joinRocketLeagueMatch(match.id, username, joinerPlayerName, joinerPlatform)
      setMyActiveMatches(prev => [...prev, match.id])
      await loadAllMatches()
      alert('✅ Match joined! Play your match and submit result when done.')
    } catch (error: any) {
      setError(error.message || 'Failed to join match')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitResult = async (matchId: string) => {
    if (!confirm('Submit match result? Make sure you both have played at least one match!')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      await submitRocketLeagueMatchResult(matchId)
      await loadAllMatches()
      alert('✅ Match result submitted successfully!')
    } catch (error: any) {
      setError(error.message || 'Failed to submit result')
      alert(`❌ ${error.message || 'Failed to submit result'}`)
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

  const parseSnapshot = (snapshotJson: string | null) => {
    if (!snapshotJson) return null
    try {
      return JSON.parse(snapshotJson)
    } catch {
      return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-blue-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-blue-500 p-3 rounded-lg">
              <span className="text-2xl">🚗</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Rocket League</h1>
              <p className="text-xs text-orange-300">Cars • Soccer • Aerial Goals</p>
            </div>
          </div>
          <a href="/" className="text-sm text-orange-300 hover:text-orange-200">
            ← Back to Games
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-orange-500/20 to-blue-500/20 border border-orange-400/30 rounded-xl p-6 mb-8">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span>ℹ️</span> How It Works (Snapshot Comparison)
          </h2>
          <ol className="space-y-2 text-sm text-orange-100 list-decimal list-inside">
            <li>Create a match with your <strong>Rocket League username</strong> - we capture your stats</li>
            <li>Wait for an opponent to join - their stats are captured too</li>
            <li><strong>Both players play ONE match each</strong> (any mode: 1v1, 2v2, 3v3, Casual, Ranked)</li>
            <li>After 10+ minutes, click "Submit Result" to compare stats</li>
            <li><strong>Winner = Most wins, then MVPs, then total score (goals+saves+assists)</strong></li>
          </ol>
          <div className="mt-4 bg-orange-900/30 border border-orange-500/30 rounded-lg p-3">
            <p className="text-sm font-semibold text-orange-200">⚠️ Important:</p>
            <p className="text-xs text-orange-300 mt-1">
              • Stats are captured BEFORE and AFTER the match<br/>
              • You must play at least ONE match after joining<br/>
              • Winner determined by: Wins → MVPs → Total Score → Goals<br/>
              • Make sure your Rocket League profile is public on your platform
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
          <h2 className="text-2xl font-bold mb-6">🚗 Create Match</h2>
          
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
                Rocket League Username
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your RL username"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
              />
              <p className="text-xs text-orange-300 mt-1">
                💡 Your username on your platform (case-sensitive)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
              >
                <option value="steam">Steam</option>
                <option value="epic">Epic Games</option>
                <option value="psn">PlayStation</option>
                <option value="xbl">Xbox</option>
                <option value="switch">Nintendo Switch</option>
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
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
              />
              <p className="text-xs text-orange-300 mt-1">
                Winner gets {wager ? (parseFloat(wager) * 1.95).toFixed(2) : '0.00'} SOL (5% fee)
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateMatch}
            disabled={loading || !username || !playerName}
            className="mt-6 w-full bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 px-6 py-3 rounded-lg font-bold disabled:cursor-not-allowed"
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
                          <span className="text-2xl">⚡</span>
                          <div>
                            <p className="font-bold text-lg">
                              {isMyMatch ? '👤 Your Match' : match.creator.username}
                            </p>
                            <p className="text-sm text-gray-400">
                              {match.summonerName1} • {match.platform1?.toUpperCase()} • {getTimeSince(match.createdAt)}
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
                const beforeSnap1 = parseSnapshot(match.beforeSnapshot1)
                const beforeSnap2 = parseSnapshot(match.beforeSnapshot2)

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
                            🚗 Playing
                          </span>
                          <span className="text-gray-400">
                            Started {match.startedAt ? getTimeSince(match.startedAt) : 'recently'}
                          </span>
                        </div>
                      </div>
                      
                      {isParticipant && (
                        <button
                          onClick={() => handleSubmitResult(match.id)}
                          disabled={loading}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6 py-3 rounded-lg font-bold"
                        >
                          📊 Submit Result
                        </button>
                      )}
                    </div>

                    {isParticipant && (
                      <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4 mt-4">
                        <p className="font-bold mb-3 text-orange-300">📋 Instructions:</p>
                        <ol className="space-y-2 text-sm list-decimal list-inside">
                          <li>Both players open Rocket League</li>
                          <li>Play ONE match each (any mode works)</li>
                          <li>Wait at least 10 minutes for stats to update</li>
                          <li>Click "Submit Result" button above to determine winner</li>
                          <li>Winner = Most wins, then MVPs, then combined score!</li>
                        </ol>
                        
                        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                          <div className="bg-black/30 rounded p-3">
                            <p className="font-bold text-orange-300 mb-2">{match.summonerName1} (Before)</p>
                            {beforeSnap1 && (
                              <>
                                <p>Wins: {beforeSnap1.wins}</p>
                                <p>Goals: {beforeSnap1.goals}</p>
                                <p>Saves: {beforeSnap1.saves}</p>
                                <p>Assists: {beforeSnap1.assists}</p>
                                <p>MVPs: {beforeSnap1.mvps}</p>
                              </>
                            )}
                          </div>
                          <div className="bg-black/30 rounded p-3">
                            <p className="font-bold text-orange-300 mb-2">{match.summonerName2} (Before)</p>
                            {beforeSnap2 && (
                              <>
                                <p>Wins: {beforeSnap2.wins}</p>
                                <p>Goals: {beforeSnap2.goals}</p>
                                <p>Saves: {beforeSnap2.saves}</p>
                                <p>Assists: {beforeSnap2.assists}</p>
                                <p>MVPs: {beforeSnap2.mvps}</p>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 bg-blue-900/40 border border-blue-500/30 rounded p-3">
                          <p className="text-xs text-blue-200">
                            💡 <strong>Tip:</strong> Make sure your profile privacy is set to PUBLIC on your platform 
                            (Steam/Epic/PSN/Xbox settings), or stats won't be trackable!
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
                
                const beforeSnap1 = parseSnapshot(match.beforeSnapshot1)
                const afterSnap1 = parseSnapshot(match.afterSnapshot1)
                const beforeSnap2 = parseSnapshot(match.beforeSnapshot2)
                const afterSnap2 = parseSnapshot(match.afterSnapshot2)

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
                        {isDraw ? '🤝 Draw!' : '🏆 Winner'}
                      </p>
                      <div className="flex justify-between items-center gap-4">
                        <div className={`flex-1 text-center p-4 rounded ${creatorWon ? 'bg-green-500/20' : 'bg-gray-800/30'}`}>
                          <p className={`font-bold text-lg ${creatorWon ? 'text-green-300' : 'text-gray-400'}`}>
                            {creatorWon && '👑 '}
                            {match.summonerName1}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">{match.creator.username}</p>
                          {beforeSnap1 && afterSnap1 && (
                            <div className="text-xs mt-2 space-y-1">
                              <p className="text-yellow-300">
                                +{afterSnap1.wins - beforeSnap1.wins} Wins | +{afterSnap1.goals - beforeSnap1.goals} Goals
                              </p>
                              <p className="text-gray-400">
                                +{afterSnap1.saves - beforeSnap1.saves} Saves | +{afterSnap1.assists - beforeSnap1.assists} Assists | +{afterSnap1.mvps - beforeSnap1.mvps} MVPs
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <span className="px-4 text-gray-500 font-bold">VS</span>
                        
                        <div className={`flex-1 text-center p-4 rounded ${joinerWon ? 'bg-green-500/20' : 'bg-gray-800/30'}`}>
                          <p className={`font-bold text-lg ${joinerWon ? 'text-green-300' : 'text-gray-400'}`}>
                            {joinerWon && '👑 '}
                            {match.summonerName2}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">{match.joiner?.username}</p>
                          {beforeSnap2 && afterSnap2 && (
                            <div className="text-xs mt-2 space-y-1">
                              <p className="text-yellow-300">
                                +{afterSnap2.wins - beforeSnap2.wins} Wins | +{afterSnap2.goals - beforeSnap2.goals} Goals
                              </p>
                              <p className="text-gray-400">
                                +{afterSnap2.saves - beforeSnap2.saves} Saves | +{afterSnap2.assists - beforeSnap2.assists} Assists | +{afterSnap2.mvps - beforeSnap2.mvps} MVPs
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {!isDraw && (
                        <p className="text-center text-green-400 font-semibold mt-4">
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

export default RocketLeaguePage