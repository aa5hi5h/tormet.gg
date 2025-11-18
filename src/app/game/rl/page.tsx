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
import { Clock, Crown, Eye, Info, Plus, Shield, Star, Swords, Trophy, Users, X, Zap } from "lucide-react"

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
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false)
  const matches = [...openMatches, ...playingMatches]
  
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

  const parseSnapshot = (snapshotJson: string | null) => {
    if (!snapshotJson) return null
    try {
      return JSON.parse(snapshotJson)
    } catch {
      return null
    }
  }

  const RLImages = ["","",""]

  const getRandomImage = (matchId: string) => {
    const hash = matchId.split('').reduce((acc,char) => acc + char.charCodeAt(0),0)
    return RLImages[hash % RLImages.length]
  }

  const getStatusBadge = (match: RocketLeagueMatchProps) => {
    if (match.status === 'PLAYING') {
      return (
        <div className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full" />
          LIVE
        </div>
      );
    }
    return (
      <div className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
        OPEN
      </div>
    );
  };


  const formatMatchDate = (_date: Date) => {
    const date = new Date(_date)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600"
            alt="Rocket League Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-orange-900/20 to-blue-900/20" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-blue-600/10 to-gray-500/10">
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        <div className="absolute top-0 right-0 w-1/2 h-full opacity-30">
          <div className="absolute top-20 right-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent transform rotate-12" />
          <div className="absolute top-40 right-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent transform rotate-12" />
          <div className="absolute top-60 right-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-500 to-transparent transform rotate-12" />
        </div>

        <div className="relative container mx-auto px-6 py-18">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 z-10">
              <div className="flex group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-blue-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative w-42 h-58 bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-orange-500/30 rounded-2xl overflow-hidden flex items-center justify-center">
                  <div className="text-6xl">🚗</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 ml-4 mb-4">
                    <span className="bg-gradient-to-r from-orange-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      LIVE
                    </span>
                    <span className="text-orange-400 text-sm font-semibold">Soccar</span>
                  </div>
                  <h1 className="text-4xl font-black text-white leading-tight ml-4 mb-4">
                    SCORE IN<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-blue-400 to-gray-400">
                      ROCKET LEAGUE
                    </span>
                  </h1>
                  <p className="text-orange-200 text-lg ml-4 mb-6">
                    Wager SOL and dominate the arena
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/80 backdrop-blur-sm border border-orange-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-orange-500/20 p-2 rounded-lg">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="text-3xl font-black text-white">
                      {matches.filter(m => m.status === 'PLAYING' || m.status === 'WAITING').length}
                    </div>
                  </div>
                  <div className="text-xs text-orange-300 font-semibold">ACTIVE MATCHES</div>
                </div>

                <div className="bg-zinc-900/80 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-3xl font-black text-white">
                      {matches.filter(m => m.status === 'WAITING').length}
                    </div>
                  </div>
                  <div className="text-xs text-blue-300 font-semibold">OPEN LOBBIES</div>
                </div>
              </div>
            </div>

            <div className="relative h-[500px] lg:h-[600px] z-10">
              <div className="absolute right-0 top-0 rounded-2xl overflow-hidden w-full h-full flex items-center justify-center">
                <div className="text-9xl">⚡</div>
              </div>

              <div className="absolute top-20 left-0 bg-black/80 backdrop-blur-md border border-orange-500/30 px-6 py-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-yellow-400" />
                  <div>
                    <div className="text-3xl font-black text-white">#{username ? '521' : '---'}</div>
                    <div className="text-xs text-orange-300 font-semibold">YOUR RANK</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-32 right-10 bg-black/80 backdrop-blur-md border border-blue-500/30 px-6 py-3 rounded-xl animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-ping absolute" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                  <span className="text-white font-bold ml-2">LIVE MATCHES</span>
                </div>
              </div>

              <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto">
            <path 
              fill="#09090b" 
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            />
          </svg>
        </div>
      </div>

      {/* Matches Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black tracking-tight text-white">OPEN MATCHES</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowInfoModal(true)}
                className="flex items-center gap-2 text-white px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-all"
              >
                <Info size={18} />
                <span className="text-sm font-medium">How it works</span>
              </button>
              <div 
                onClick={() => setShowCreateModal(true)} 
                className="flex text-white text-lg px-4 py-2 bg-gradient-to-r from-orange-600 to-blue-600 gap-1 rounded-md cursor-pointer items-center hover:from-orange-500 hover:to-blue-500 transition-all"
              >
                <span className="text-lg font-medium">Create</span>
                <Plus size={22} />
              </div>
            </div>
          </div>
          <p className="pl-1 text-slate-300">Boost, score, and win prizes</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {matches.map((match) => {
            const isMyMatch = match.creator.username === username
            const slots = match.joiner ? '2/2' : '1/2'
            const prizePool = (match.wager * 1.95).toFixed(3)

            return (
              <div 
                key={match.id}
                className="group relative"
              >
                <div className={`absolute inset-0 rounded-xl blur-xl transition-all ${
                  match.status === 'PLAYING' 
                    ? 'bg-blue-500/20 group-hover:bg-blue-500/30' 
                    : 'bg-gradient-to-br from-orange-500/20 to-blue-500/20 group-hover:from-orange-500/30 group-hover:to-blue-500/30'
                }`} />
                
                <div className="relative bg-zinc-900/90 backdrop-blur-sm border border-orange-500/20 rounded-2xl overflow-hidden">
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-900/50 to-blue-900/50">
                    <img 
                      src={getRandomImage(match.id)} 
                      alt="Match"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                    
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(match)}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2">
                        <p className="text-white font-bold text-sm truncate">
                          {match.summonerName1 || 'Anonymous'}
                        </p>
                        <p className="text-orange-300 text-xs">{match.platform1?.toUpperCase()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono text-xs">{formatMatchDate(match.createdAt)}</span>
                      </div>
                      <div className="flex text-yellow-500 items-center gap-1">
                        <Swords className="w-4 h-4" />
                        <span className="font-mono text-sm font-bold">{match.wager} SOL</span>
                      </div>
                    </div>

                    {match.status === 'WAITING' && !isMyMatch && (
                      <button 
                        onClick={() => handleJoinMatch(match)} 
                        className="w-full bg-gradient-to-r from-orange-600 to-blue-600 hover:from-orange-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 flex items-center overflow-hidden group/btn"
                      >
                        <span className="flex-1 text-lg font-mono py-3">Join Match</span>
                      </button>
                    )}

                    {match.status === 'PLAYING' && (
                      <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center gap-2">
                        <Eye className="w-5 h-5" />
                        View Stats
                      </button>
                    )}

                    {isMyMatch && match.status === 'WAITING' && (
                      <div className="w-full bg-zinc-800/50 text-zinc-400 py-3 rounded-xl font-bold text-center">
                        Waiting for opponent...
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                      <div className="flex items-center gap-1 text-zinc-400 text-sm">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold">{slots}</span>
                      </div>
                      <div className="flex font-semibold items-center gap-1 text-yellow-400 text-sm">
                        <Trophy className="w-4 h-4" />
                        <span>{prizePool} SOL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {matches.length === 0 && (
          <div className="border-2 border-dashed border-zinc-800 rounded-xl p-16 text-center">
            <div className="text-8xl mb-6">🚗</div>
            <p className="text-zinc-500 text-xl font-bold mb-2">NO ACTIVE MATCHES</p>
            <p className="text-zinc-600">Be the first to create one!</p>
          </div>
        )}

        {/* Playing Matches Detail Section */}
        {playingMatches.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-black tracking-tight text-white mb-6">MATCHES IN PROGRESS</h2>
            <div className="space-y-4">
              {playingMatches.map((match) => {
                const isParticipant = match.creator.username === username || match.joiner?.username === username
                const beforeSnap1 = parseSnapshot(match.beforeSnapshot1)
                const beforeSnap2 = parseSnapshot(match.beforeSnapshot2)

                return (
                  <div
                    key={match.id}
                    className={`bg-zinc-900/90 backdrop-blur-sm border rounded-2xl p-6 ${
                      isParticipant ? 'border-orange-500/30' : 'border-zinc-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-2xl mb-2 text-white">
                          {match.summonerName1} vs {match.summonerName2}
                        </p>
                        <div className="flex gap-2 text-sm">
                          <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                            🚗 Playing
                          </span>
                          <span className="text-gray-400">
                            Started {match.startedAt ? formatMatchDate(match.startedAt) : 'recently'}
                          </span>
                        </div>
                      </div>
                      
                      {isParticipant && (
                        <button
                          onClick={() => handleSubmitResult(match.id)}
                          disabled={loading}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6 py-3 rounded-lg font-bold text-white shadow-lg"
                        >
                          📊 Submit Result
                        </button>
                      )}
                    </div>

                    {isParticipant && beforeSnap1 && beforeSnap2 && (
                      <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-5 mt-4">
                        <p className="font-bold mb-4 text-orange-300 text-lg">📊 Pre-Match Stats</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="bg-black/30 rounded-lg p-4">
                            <p className="font-bold text-orange-300 mb-3 text-base">{match.summonerName1}</p>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Wins:</span>
                                <span className="text-white font-semibold">{beforeSnap1.wins}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Goals:</span>
                                <span className="text-white font-semibold">{beforeSnap1.goals}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Saves:</span>
                                <span className="text-white font-semibold">{beforeSnap1.saves}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Assists:</span>
                                <span className="text-white font-semibold">{beforeSnap1.assists}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">MVPs:</span>
                                <span className="text-yellow-400 font-semibold">{beforeSnap1.mvps}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-black/30 rounded-lg p-4">
                            <p className="font-bold text-blue-300 mb-3 text-base">{match.summonerName2}</p>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Wins:</span>
                                <span className="text-white font-semibold">{beforeSnap2.wins}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Goals:</span>
                                <span className="text-white font-semibold">{beforeSnap2.goals}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Saves:</span>
                                <span className="text-white font-semibold">{beforeSnap2.saves}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Assists:</span>
                                <span className="text-white font-semibold">{beforeSnap2.assists}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">MVPs:</span>
                                <span className="text-yellow-400 font-semibold">{beforeSnap2.mvps}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                          <p className="text-xs text-blue-200">
                            💡 <strong>Tip:</strong> Both players must play ONE match each. After 10+ minutes, click Submit Result to compare stats and determine the winner!
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
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900/95 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Info className="w-6 h-6 text-orange-400" />
                How Rocket League Matches Work
              </h3>
              <X onClick={() => setShowInfoModal(false)} className="cursor-pointer text-gray-400 hover:text-white" size={24} />
            </div>

            <div className="space-y-4 text-sm text-gray-300">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <h4 className="font-bold text-orange-400 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Snapshot Comparison System
                </h4>
                <ol className="space-y-2 list-decimal list-inside">
                  <li>Create a match with your <strong>Rocket League username</strong> - we capture your stats</li>
                  <li>Wait for an opponent to join - their stats are captured too</li>
                  <li><strong>Both players play ONE match each</strong> (any mode: 1v1, 2v2, 3v3, Casual, Ranked)</li>
                  <li>After 10+ minutes, click "Submit Result" to compare stats</li>
                  <li><strong>Winner = Most wins, then MVPs, then total score (goals+saves+assists)</strong></li>
                </ol>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Important Requirements
                </h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Stats are captured BEFORE and AFTER the match</li>
                  <li>You must play at least ONE match after joining</li>
                  <li>Winner determined by: Wins → MVPs → Total Score → Goals</li>
                  <li>Make sure your Rocket League profile is <strong>public</strong> on your platform</li>
                </ul>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <h4 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Platform Settings
                </h4>
                <p className="mb-2">Ensure your profile is public:</p>
                <ul className="space-y-1 list-disc list-inside text-xs">
                  <li><strong>Steam:</strong> Profile → Edit Profile → Privacy Settings → Game Details (Public)</li>
                  <li><strong>Epic:</strong> Settings → Account → Privacy → Show Online Status</li>
                  <li><strong>PlayStation:</strong> Settings → Account Management → Privacy Settings</li>
                  <li><strong>Xbox:</strong> Settings → Account → Privacy & Online Safety</li>
                </ul>
              </div>

              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Prize Distribution
                </h4>
                <p>Winner takes 95% of the total pot (5% platform fee). Example: 4 SOL wager = 3.8 SOL to winner!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Match Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900/95 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-white">Create Match</h3>
              <X onClick={() => setShowCreateModal(false)} className="cursor-pointer text-gray-400 hover:text-white" size={24} />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <input
                placeholder="Enter your username"
                className="bg-zinc-800 border-2 border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-lg w-full focus:outline-none focus:border-orange-500 transition-colors"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <div>
                <label className="text-xs text-orange-300 font-semibold mb-2 block">
                  ROCKET LEAGUE USERNAME
                </label>
                <input
                  placeholder="Your RL username"
                  className="bg-zinc-800 border-2 border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-lg w-full focus:outline-none focus:border-orange-500 transition-colors"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Your username on your platform (case-sensitive)</p>
              </div>

              <div>
                <label className="text-xs text-orange-300 font-semibold mb-1 block">PLATFORM</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="bg-zinc-800 border-2 border-zinc-700 text-white p-3 rounded-lg w-full focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="steam">Steam</option>
                  <option value="epic">Epic Games</option>
                  <option value="psn">PlayStation</option>
                  <option value="xbl">Xbox</option>
                  <option value="switch">Nintendo Switch</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-orange-300 font-semibold mb-1 block">WAGER AMOUNT</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="2.5"
                    className="bg-zinc-800 border-2 border-zinc-700 text-white p-3 rounded-lg w-full focus:outline-none focus:border-orange-500 transition-colors"
                    value={wager}
                    onChange={(e) => setWager(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-green-400 font-semibold mb-1 block">WINNER GETS</label>
                  <div className="bg-zinc-800 border-2 border-green-500/30 text-green-400 p-3 rounded-lg font-bold text-center">
                    {(parseFloat(wager || '0') * 1.95).toFixed(3)} SOL
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleCreateMatch}
                disabled={!username || !playerName || loading || parseFloat(wager || '0') <= 0}
                className="bg-gradient-to-r from-orange-600 via-blue-600 to-gray-500 hover:from-orange-500 hover:via-blue-500 hover:to-gray-400 text-white px-8 py-4 rounded-lg font-black text-lg w-full disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
              >
                {loading ? '⏳ CREATING...' : '🚗 CREATE MATCH'}
              </button>

              <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-400">
                <p className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-400" />
                  5% platform fee • Winner takes 95% of pot
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RocketLeaguePage