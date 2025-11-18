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
import { Clock, Crown, Eye, Info, Plus, Shield, Star, Swords, Trophy, Users, X, Zap } from "lucide-react"

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
  const [showCreateModal , setShowCreateModal] = useState<boolean>(false)
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false)
  const matches = [...openMatches, ...playingMatches]
  
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

  const LoLImages = [
    "","","",""
  ]

  const getRandomImage = (matchId: string) => {
    const hash = matchId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return LoLImages[hash % LoLImages.length]
  }

  const formatMatchDate = (_date: Date) => {
    const date = new Date(_date)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60)
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m ago`
    return `${Math.floor(diff / 60)}h ago`
  }

  const getStatusBadge = (match: LoLMatchProps) => {
    if (match.status === 'PLAYING') {
      return (
        <div className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full" />
          IN GAME
        </div>
      )
    }
    return (
      <div className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
        OPEN
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600"
            alt="LoL Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-blue-900/20 to-purple-900/20" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-indigo-500/10">
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        <div className="absolute top-0 right-0 w-1/2 h-full opacity-30">
          <div className="absolute top-20 right-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent transform rotate-12" />
          <div className="absolute top-40 right-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent transform rotate-12" />
          <div className="absolute top-60 right-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent transform rotate-12" />
        </div>

        <div className="relative container mx-auto px-6 py-18">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 z-10">
              <div className="flex group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative w-42 h-58 bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-blue-500/30 rounded-2xl overflow-hidden flex items-center justify-center">
                  <div className="text-6xl">⚔️</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 ml-4 mb-4">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      LIVE
                    </span>
                    <span className="text-blue-400 text-sm font-semibold">MOBA</span>
                  </div>
                  <h1 className="text-4xl font-black text-white leading-tight ml-4 mb-4">
                    DOMINATE<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400">
                      THE LEAGUE
                    </span>
                  </h1>
                  <p className="text-blue-200 text-lg ml-4 mb-6">
                    Wager SOL and dominate the League
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/80 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="text-3xl font-black text-white">
                      {matches.filter(m => m.status === 'PLAYING' || m.status === 'WAITING').length}
                    </div>
                  </div>
                  <div className="text-xs text-blue-300 font-semibold">ACTIVE MATCHES</div>
                </div>

                <div className="bg-zinc-900/80 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-3xl font-black text-white">
                      {matches.filter(m => m.status === 'WAITING').length}
                    </div>
                  </div>
                  <div className="text-xs text-purple-300 font-semibold">OPEN LOBBIES</div>
                </div>
              </div>
            </div>

            <div className="relative h-[500px] lg:h-[600px] z-10">
              <div className="absolute right-0 top-0 rounded-2xl overflow-hidden w-full h-full flex items-center justify-center">
                <div className="text-9xl">🎮</div>
              </div>

              <div className="absolute top-20 left-0 bg-black/80 backdrop-blur-md border border-blue-500/30 px-6 py-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-yellow-400" />
                  <div>
                    <div className="text-3xl font-black text-white">#{username ? '347' : '---'}</div>
                    <div className="text-xs text-blue-300 font-semibold">YOUR RANK</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-32 right-10 bg-black/80 backdrop-blur-md border border-purple-500/30 px-6 py-3 rounded-xl animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-ping absolute" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                  <span className="text-white font-bold ml-2">LIVE MATCHES</span>
                </div>
              </div>

              <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
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
                className="flex text-white text-lg px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 gap-1 rounded-md cursor-pointer items-center hover:from-blue-500 hover:to-purple-500 transition-all"
              >
                <span className="text-lg font-medium">Create</span>
                <Plus size={22} />
              </div>
            </div>
          </div>
          <p className="pl-1 text-slate-300">Battle on Summoner's Rift and win prizes</p>
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
                    : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30'
                }`} />
                
                <div className="relative bg-zinc-900/90 backdrop-blur-sm border border-blue-500/20 rounded-2xl overflow-hidden">
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-900/50 to-purple-900/50">
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
                        <p className="text-blue-300 text-xs">{match.region}</p>
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
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center overflow-hidden group/btn"
                      >
                        <span className="flex-1 text-lg font-mono py-3">Join Match</span>
                      </button>
                    )}

                    {match.status === 'PLAYING' && (
                      <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center gap-2">
                        <Eye className="w-5 h-5" />
                        Spectate
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
            <div className="text-8xl mb-6">🎮</div>
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

                return (
                  <div
                    key={match.id}
                    className={`bg-zinc-900/90 backdrop-blur-sm border rounded-2xl p-6 ${
                      isParticipant ? 'border-blue-500/30' : 'border-zinc-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-2xl mb-2 text-white">
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
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 mt-4">
                        <p className="font-bold mb-4 text-blue-300 text-lg flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Match Instructions
                        </p>
                        <ol className="space-y-2 text-sm list-decimal list-inside text-gray-300">
                          <li>Open League of Legends client</li>
                          <li>Add opponent as friend: <strong className="text-purple-300">{match.creator.username === username ? match.summonerName2 : match.summonerName1}</strong></li>
                          <li>Create Custom 1v1 game OR play any mode (opposite teams!)</li>
                          <li>Play the match</li>
                          <li>Winner will be detected automatically! ⏱️ Checking every 10s...</li>
                        </ol>

                        <div className="mt-4 bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
                          <p className="text-xs text-purple-200">
                            💡 <strong>Tip:</strong> Make sure you're on opposite teams or the match will be marked as a draw!
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
          <div className="bg-zinc-900/95 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-400" />
                How League of Legends Matches Work
              </h3>
              <X onClick={() => setShowInfoModal(false)} className="cursor-pointer text-gray-400 hover:text-white" size={24} />
            </div>

            <div className="space-y-4 text-sm text-gray-300">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Step-by-Step Guide
                </h4>
                <ol className="space-y-2 list-decimal list-inside">
                  <li>Create a match with your Summoner Name and wager amount</li>
                  <li>Wait for an opponent to join (they'll use their Summoner Name)</li>
                  <li>Both players add each other in League of Legends</li>
                  <li>Play a game together (Custom 1v1 or any mode on opposite teams)</li>
                  <li>Winner is automatically detected and receives the payout!</li>
                </ol>
              </div>

              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <h4 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
                  <Swords className="w-4 h-4" />
                  Game Modes
                </h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Custom 1v1</strong> - Create a custom game and 1v1 on mid lane</li>
                  <li><strong>Normal/Ranked</strong> - Queue together but on opposite teams</li>
                  <li><strong>ARAM</strong> - All Random All Mid on opposite teams</li>
                </ul>
              </div>

              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
                <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Important Rules
                </h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>You must be on <strong>opposite teams</strong></li>
                  <li>Winner detected automatically from match history</li>
                  <li>Same team = Match marked as draw</li>
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
          <div className="bg-zinc-900/95 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 max-w-md w-full">
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
                className="bg-zinc-800 border-2 border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-lg w-full focus:outline-none focus:border-blue-500 transition-colors"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <div>
                <label className="text-xs text-blue-300 font-semibold mb-2 block">
                  SUMMONER NAME
                </label>
                <input
                  placeholder="Your LoL summoner name"
                  className="bg-zinc-800 border-2 border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-lg w-full focus:outline-none focus:border-blue-500 transition-colors"
                  value={summonerName}
                  onChange={(e) => setSummonerName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-blue-300 font-semibold mb-1 block">REGION</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="bg-zinc-800 border-2 border-zinc-700 text-white p-3 rounded-lg w-full focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {Object.entries(REGIONS).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name} ({code})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-blue-300 font-semibold mb-1 block">WAGER AMOUNT</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="2.0"
                    className="bg-zinc-800 border-2 border-zinc-700 text-white p-3 rounded-lg w-full focus:outline-none focus:border-blue-500 transition-colors"
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
                disabled={!username || !summonerName || loading || parseFloat(wager || '0') <= 0}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-500 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-400 text-white px-8 py-4 rounded-lg font-black text-lg w-full disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
              >
                {loading ? '⏳ CREATING...' : '⚔️ CREATE MATCH'}
              </button>

              <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-400">
                <p className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
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