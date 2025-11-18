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
import { Clock, Crown, Eye, Plus, Shield, Swords, Trophy, Users, X } from "lucide-react"
import Image from "next/image"
import backgroundImage from "../../../../public/bs-2.jpg"
import CsgoImg from "../../../../public/cs-1.jpg"
import heroImg from "../../../../public/brawlc-3.webp"
import solPng from "../../../../public/solana_gold-removebg-preview.png"
import solSvg from "../../../../public/solana-sol-logo.svg"

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
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [showInfoModal , setShowInfoModal] = useState<boolean>(false)
  const [showGameModal ,setShowGameModal] = useState<boolean>(false)
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

  const CsgoImages = [
    "",
    "",
    ""
  ]

  const getRandomImage = (matchId: string) => {
      const hash = matchId.split('').reduce((acc,char) => acc + char.charCodeAt(0),0)
      return CsgoImages[hash % CsgoImages.length]
    }
  
    const formatMatchDate = (_date: Date) => {
      const date = new Date(_date)
      const now = new Date()
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
      if (diff < 1) return 'Just now';
      if (diff < 60) return `${diff}m ago`;
      return `${Math.floor(diff / 60)}h ago`;
    }
  
     const getStatusBadge = (match: CSGOMatchProps) => {
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
  
    return (
      <div className="min-h-screen bg-zinc-900">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden">
           <div className="absolute inset-0">
                <Image
                  src={backgroundImage}
                  alt="Chess Background"
                  className="w-full h-full object-cover opacity-20"
                />
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-purple-900/20 to-black/20" />
              </div>
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-yellow-500/10">
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}
            />
          </div>
  
          {/* Diagonal Accent Lines */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-30">
            <div className="absolute top-20 right-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent transform rotate-12" />
            <div className="absolute top-40 right-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent transform rotate-12" />
            <div className="absolute top-60 right-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent transform rotate-12" />
          </div>
  
          <div className="relative container mx-auto px-6 py-18">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Game Info */}
              <div className="space-y-8 z-10">
                {/* Game Card */}
                <div className="flex group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-yellow-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative w-42 h-58 bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-purple-500/30 rounded-2xl overflow-hidden flex items-center justify-center">
                     <Image
                     src={CsgoImg}
                     alt="Chess"
                     className="w-42 h-58 object-cover"
                     />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 ml-4 mb-4">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        LIVE
                      </span>
                      <span className="text-purple-400 text-sm font-semibold">Season 1</span>
                    </div>
                    <h1 className="text-4xl font-black text-white leading-tight ml-4 mb-4">
                      BRAWL IN<br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400">
                        3v3 BATTLES
                      </span>
                    </h1>
                    <p className="text-purple-200 text-lg ml-4 mb-6">
                      Wager SOL and prove your brawling skills
                    </p>
                  </div>
                </div>
  
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/80 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-purple-500/20 p-2 rounded-lg">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div className="text-3xl font-black text-white">
                        {matches.filter(m => m.status === 'PLAYING' || m.status === 'WAITING').length}
                      </div>
                    </div>
                    <div className="text-xs text-purple-300 font-semibold">ACTIVE BRAWLS</div>
                  </div>
  
                  <div className="bg-zinc-900/80 backdrop-blur-sm border border-pink-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-pink-500/20 p-2 rounded-lg">
                        <Users className="w-5 h-5 text-pink-400" />
                      </div>
                      <div className="text-3xl font-black text-white">
                        {matches.filter(m => m.status === 'WAITING').length}
                      </div>
                    </div>
                    <div className="text-xs text-pink-300 font-semibold">OPEN LOBBIES</div>
                  </div>
                </div>
              </div>
  
              {/* Right Side - Visual */}
              <div className="relative h-[500px] lg:h-[600px] z-10">
                {/* Hero Image Placeholder */}
               <div className="absolute right-0 top-0 rounded-2xl overflow-hidden w-full h-full">
                              <Image 
                              src={heroImg}
                              alt="brawl characters"
                              className="absolute right-0 top-0 rounded-2xl h-full w-auto object-contain drop-shadow-[0_0_50px_rgba(168,85,247,0.4)]"
                               />
              </div>
  
                {/* Floating Rank Card */}
                <div className="absolute top-20 left-0 bg-black/80 backdrop-blur-md border border-purple-500/30 px-6 py-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Crown className="w-8 h-8 text-yellow-400" />
                    <div>
                      <div className="text-3xl font-black text-white">#{username ? '89' : '---'}</div>
                      <div className="text-xs text-purple-300 font-semibold">YOUR RANK</div>
                    </div>
                  </div>
                </div>
  
                {/* Floating Active Indicator */}
                <div className="absolute bottom-32 right-10 bg-black/80 backdrop-blur-md border border-pink-500/30 px-6 py-3 rounded-xl animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-ping absolute" />
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                    <span className="text-white font-bold ml-2">LIVE BRAWLS</span>
                  </div>
                </div>
  
                {/* Glow Effect */}
                <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
  
          {/* Wave Divider */}
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
              <h2 className="text-3xl font-black tracking-tight text-white">OPEN BRAWLS</h2>
              <div 
                onClick={() => setShowCreateModal(true)} 
                className="flex text-white text-lg px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 gap-1 rounded-md cursor-pointer items-center hover:from-purple-500 hover:to-pink-500 transition-all"
              >
                <span className="text-lg font-medium">Create</span>
                <Plus size={22} />
              </div>
            </div>
            <p className="pl-1 text-slate-300">Join the arena and battle for prizes</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {matches.map((match) => {
              const isMyMatch = match.creator.username === username;
              const slots = match.joiner ? '2/2' : '1/2';
              const prizePool = (match.wager * 2 * 0.95).toFixed(3);
  
              return (
                <div 
                  key={match.id}
                  className="group relative"
                >
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 rounded-xl blur-xl transition-all ${
                    match.status === 'PLAYING' 
                      ? 'bg-blue-500/20 group-hover:bg-blue-500/30' 
                      : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30'
                  }`} />
                  
                  {/* Card */}
                  <div className="relative bg-zinc-900/90 backdrop-blur-sm border border-purple-500/20 rounded-2xl overflow-hidden">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                      <img 
                        src={getRandomImage(match.id)} 
                        alt="Match"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                      
                      {/* Status badge */}
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(match)}
                      </div>
                    </div>
  
                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span className="font-mono text-xs">{formatMatchDate(match.createdAt)}</span>
                        </div>
                       <div className="flex text-yellow-600 items-center gap-1 ">
                                                 <Swords className="w-4 h-4" />
                                               <span className="font-mono text-sm">{match.wager}</span>
                                               <Image 
                                                 src={solSvg} 
                                                 alt="SOL" 
                                                 className="w-3 h-3" 
                                                 style={{filter: 'brightness(0) saturate(100%) invert(74%) sepia(66%) saturate(578%) hue-rotate(359deg) brightness(90%) contrast(101%)'}} />
                                             </div>
                      </div>
  
                      {match.status === 'WAITING' && !isMyMatch && (
                        <button onClick={() => handleJoinMatch} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 flex items-center overflow-hidden group/btn">
                          <span className="flex-1 text-lg font-mono py-3">Join Brawl</span>
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
  
                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                        <div className="flex items-center gap-1 text-zinc-400 text-sm">
                          <Users className="w-4 h-4" />
                          <span className="font-semibold">{slots}</span>
                        </div>
                       <div className="flex font-semibold items-center gap-1 text-yellow-400 text-sm">
                          <Trophy className="w-4 h-4" />
                          <span className="">{prizePool}</span>
                          <Image src={solPng} alt="SOL" className="w-8 h-6" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
  
          {matches.length === 0 && (
            <div className="border-2 border-dashed border-zinc-800 rounded-xl p-16 text-center">
              <div className="text-8xl mb-6">⚔️</div>
              <p className="text-zinc-500 text-xl font-bold mb-2">NO ACTIVE BRAWLS</p>
              <p className="text-zinc-600">Be the first to create one!</p>
            </div>
          )}
        </div>
  
        {/* Create Match Modal */}
        {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="bg-zinc-900/95 backdrop-blur-sm border border-orange-500/30 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white">Create Match</h3>
                <X onClick={() => setShowCreateModal(false)} className="cursor-pointer text-gray-400 hover:text-white" size={24} />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <input
                placeholder="Enter your username"
                className="bg-zinc-800 border-2 border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-lg w-full focus:outline-none focus:border-orange-500 transition-colors"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <div>
                <label className="text-xs text-orange-300 font-semibold mb-2 block">
                  STEAM ID <span className="text-yellow-400">(17 digits)</span>
                </label>
                <input
                  placeholder="76561198012345678"
                  className="bg-zinc-800 border-2 border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-lg w-full focus:outline-none focus:border-orange-500 transition-colors"
                  value={steamId}
                  onChange={(e) => setSteamId(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Find at: steamid.io</p>
              </div>

              <input
                placeholder="In-game name (optional)"
                className="bg-zinc-800 border-2 border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-lg w-full focus:outline-none focus:border-orange-500 transition-colors"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-orange-300 font-semibold mb-1 block">WAGER AMOUNT</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.001"
                    placeholder="0.5"
                    className="bg-zinc-800 border-2 border-zinc-700 text-white p-3 rounded-lg w-full focus:outline-none focus:border-orange-500 transition-colors"
                    value={wager}
                    onChange={(e) => setWager(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-green-400 font-semibold mb-1 block">WINNER GETS</label>
                  <div className="bg-zinc-800 border-2 border-green-500/30 text-green-400 p-3 rounded-lg font-bold text-center">
                    {(parseFloat(wager || '0') * 2 * 0.95).toFixed(3)} SOL
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateMatch}
                disabled={!username || !steamId || loading || parseFloat(wager || '0') <= 0}
                className="bg-gradient-to-r from-orange-600 via-red-600 to-purple-600 hover:from-orange-500 hover:via-red-500 hover:to-purple-500 text-white px-8 py-4 rounded-lg font-black text-lg w-full disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
              >
                {loading ? '⏳ CREATING...' : '⚡ CREATE MATCH'}
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
  
        {/* Game Ready Modal */}
        {showGameModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-purple-500/30 rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-3xl font-black text-white mb-4 text-center">
                🎮 BRAWL READY!
              </h2>
              <p className="text-center mb-6 text-zinc-400">
                Your match is set up. Add opponent and start brawling!
              </p>
              <div className="space-y-3">
                <button
                  className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-4 rounded-lg text-center font-black transition-all text-lg"
                  onClick={() => setShowGameModal(false)}
                >
                  🚀 GOT IT!
                </button>
                <button
                  onClick={() => setShowGameModal(false)}
                  className="block w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-6 py-2 rounded-lg text-center transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };