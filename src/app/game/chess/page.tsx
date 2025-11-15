"use client"
import axios from "axios"
import { useState, useEffect, useRef } from "react"
import { checkAndUpdateGameResults, getAllActiveMatches, getOpenMatches } from "../../../lib/server-action/mian"
import WalletButton, { useJoinMatchWithEscrow, useMatchCreationWithEscrow } from "@/components/wallet-button"
import { Crown, Eye, Shield, Sword, Trophy, Users, Zap } from "lucide-react"

interface MatchProps {
  id: string
  creator: {
    username: string
  }
  joiner?: {
    username: string
  } | null
  gameId?: string
  url?: string
  status: 'WAITING' | 'PLAYING' | 'FINISHED' | 'CANCELLED'
  winner?: 'WHITE' | 'BLACK' | 'DRAW' | null
  wager: number
  gameType: string
  creatorColor?: string | null
  joinerColor?: string | null
}

const ChessInterface = () => {
  const [name, setName] = useState<string>('')
  const [wagerAmount, setWagerAmount] = useState<number>(0.1)
  const [matches, setMatches] = useState<MatchProps[]>([])
  const [loading, setLoading] = useState(false)
  const [myActiveMatches, setMyActiveMatches] = useState<string[]>([])
  const [myCreatedMatches, setMyCreatedMatches] = useState<Map<string, string>>(new Map())
  const [previousMatchStates, setPreviousMatchStates] = useState<Map<string, string>>(new Map())
  const [joiningMatchId, setJoiningMatchId] = useState<string | null>(null)
  const [pendingGameUrl, setPendingGameUrl] = useState<string | null>(null)
  const [showGameModal, setShowGameModal] = useState(false)
  const hasRedirectedRef = useRef<Set<string>>(new Set())

  const { createMatch: createMatchWithWallet, loading: creatingMatch, error: createError } = useMatchCreationWithEscrow()
  const { joinMatch: joinMatchWithWallet, loading: joiningMatch, error: joinError } = useJoinMatchWithEscrow()

  useEffect(() => {
    loadMatches()
  }, [])

  // Heavy operation: Check game results every 60 seconds
  useEffect(() => {
    const gameCheckInterval = setInterval(async () => {
      console.log('🔍 Checking game results...')
      await checkAndUpdateGameResults()
      await loadMatches()
    }, 60000)

    return () => clearInterval(gameCheckInterval)
  }, [])

  // Lightweight operation: Check for match status changes every 5 seconds
  useEffect(() => {
    const statusCheckInterval = setInterval(async () => {
      if (myCreatedMatches.size === 0) return
      
      console.log('👀 Checking match status for redirects...')
      
      try {
        const allMatches = await getAllActiveMatches()
        
        allMatches.forEach((match: any) => {
          if (myCreatedMatches.has(match.id)) {
            const previousStatus = previousMatchStates.get(match.id)
            
            if (previousStatus === 'WAITING' && match.status === 'PLAYING') {
              if (!hasRedirectedRef.current.has(match.id)) {
                hasRedirectedRef.current.add(match.id)
                
                console.log('🎮 Your match started! Someone joined!', match.gameId)
                const lichessUrl = myCreatedMatches.get(match.id)
                
                if (lichessUrl) {
                  console.log('🔗 Setting pending game URL:', lichessUrl)
                  setPendingGameUrl(lichessUrl)
                  setShowGameModal(true)
                }
              }
            }
            
            setPreviousMatchStates(prev => new Map(prev).set(match.id, match.status))
          }
        })
      } catch (error) {
        console.error('Error checking match status:', error)
      }
    }, 5000)

    return () => clearInterval(statusCheckInterval)
  }, [myCreatedMatches, previousMatchStates])

  const loadMatches = async () => {
    try {
      const openMatches = await getOpenMatches()
      setMatches(openMatches as any)
    } catch (error) {
      console.error('Error loading matches:', error)
    }
  }

  const onCreateMatch = async () => {
    if (!name) {
      alert('⚠️  Please enter your username')
      return
    }
    
    if (wagerAmount <= 0) {
      alert('⚠️  Wager amount must be greater than 0')
      return
    }

    if (creatingMatch || loading) {
      alert('⏳ Already creating a match...')
      return
    }
    
    setLoading(true)
    try {
      console.log('🎮 Creating Lichess game...')
      
      const lichessResponse = await axios.post('https://lichess.org/api/challenge/open', { 
        clock: { limit: 300, increment: 0 },
        rated: false,
      })
      
      console.log('✅ Lichess game created:', lichessResponse.data)
      
      const creatorColor = lichessResponse.data.finalColor
      const joinerColor = creatorColor === 'white' ? 'black' : 'white'
      
      const creatorUrl = creatorColor === 'white' 
        ? lichessResponse.data.urlWhite 
        : lichessResponse.data.urlBlack
      
      console.log(`🎨 Colors assigned - Creator: ${creatorColor}, Joiner: ${joinerColor}`)
      console.log(`🔗 Creator URL: ${creatorUrl}`)
      
      const result = await createMatchWithWallet(
        name,
        'CHESS',
        wagerAmount,
        {
          gameId: lichessResponse.data.id,
          url: lichessResponse.data.url,
          creatorColor: creatorColor,
          joinerColor: joinerColor,
        }
      )

      if (!result || !result.success || !result.match) {
        throw new Error(result?.error || 'Failed to create match')
      }

      setMyActiveMatches(prev => [...prev, result.match.id])
      setMyCreatedMatches(prev => new Map(prev).set(result.match.id, creatorUrl))
      setPreviousMatchStates(prev => new Map(prev).set(result.match.id, 'WAITING'))
      
      loadMatches().catch(err => console.error('Failed to reload:', err))
      
      alert(`✅ Match created successfully!\n💰 Deposited ${wagerAmount} SOL to escrow\n🎨 You are playing as: ${creatorColor.toUpperCase()}\n\n⏳ Waiting for opponent to join...\n🔔 Game will open automatically when someone joins!`)
      
    } catch (error: any) {
      console.error('❌ Create match error:', error)
      
      const errorMsg = error.message || error.toString()
      
      if (errorMsg === 'WALLET_CANCELLED') {
        alert('❌ Transaction cancelled\n\nPlease approve the transaction in your wallet to create a match.')
      } else if (errorMsg === 'INSUFFICIENT_FUNDS') {
        alert(`❌ Insufficient SOL balance\n\nYou need at least ${wagerAmount} SOL plus transaction fees (~0.001 SOL).`)
      } else if (errorMsg === 'WALLET_NOT_CONNECTED') {
        alert('❌ Wallet not connected\n\nPlease connect your wallet first.')
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        alert('❌ Network error\n\nPlease check your internet connection and try again.')
      } else {
        alert(`❌ Failed to create match\n\n${errorMsg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const onJoinMatch = async (match: MatchProps) => {
    if (!name) {
      alert('⚠️  Please enter your username first')
      return
    }
    
    if (match.creator.username === name) {
      alert('⚠️  You cannot join your own match!')
      return
    }

    if (joiningMatch || joiningMatchId) {
      alert('⏳ Please wait, already joining a match...')
      return
    }

    if (match.joiner?.username === name) {
      alert('ℹ️  You already joined this match!')
      return
    }
    
    setJoiningMatchId(match.id)
    
    try {
      console.log('🎮 Joining match:', match.id)
      console.log(`🎨 You will play as: ${match.joinerColor?.toUpperCase() || 'UNKNOWN'}`)

      const result = await joinMatchWithWallet(
        match.id,
        name,
        match.wager,
        {}
      )
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Failed to join match')
      }

      console.log('✅ Join successful!')

      let lichessUrl = result.match?.url || match.url
      
      if (lichessUrl && match.joinerColor) {
        if (!lichessUrl.includes('?color=')) {
          lichessUrl = lichessUrl + `?color=${match.joinerColor}`
        }
      }
      
      console.log('🔗 Lichess URL for joiner:', lichessUrl)
      
      if (lichessUrl) {
        setPendingGameUrl(lichessUrl)
        setShowGameModal(true)
        
        alert(
          `✅ Successfully joined match!\n` +
          `💰 Deposited ${match.wager} SOL\n` +
          `🎨 Playing as: ${match.joinerColor?.toUpperCase()}\n\n` +
          `🎮 Click the "Open Game" button to start playing!`
        )
      } else {
        console.error('❌ NO URL FOUND!')
        alert(
          `✅ Joined match!\n` +
          `💰 Deposited ${match.wager} SOL\n` +
          `🎨 Playing as: ${match.joinerColor?.toUpperCase()}\n\n` +
          `⚠️ Could not find game URL - please check the matches list`
        )
      }

      loadMatches().catch(err => console.error('Failed to reload:', err))
      
    } catch (error: any) {
      console.error('❌ Join match error:', error)
      
      const errorMsg = error.message || error.toString()
      
      if (errorMsg === 'WALLET_CANCELLED') {
        alert('❌ Transaction cancelled\n\nPlease approve the transaction in your wallet to join the match.')
      } else if (errorMsg === 'INSUFFICIENT_FUNDS') {
        alert(`❌ Insufficient SOL balance\n\nYou need at least ${match.wager} SOL plus transaction fees (~0.001 SOL).`)
      } else if (errorMsg === 'WALLET_NOT_CONNECTED') {
        alert('❌ Wallet not connected\n\nPlease connect your wallet first.')
      } else if (errorMsg.includes('already connected to user')) {
        alert(`❌ ${errorMsg}\n\nThis wallet is linked to another account.`)
      } else if (errorMsg.includes('cannot join your own match')) {
        alert('❌ You cannot join your own match!')
      } else if (errorMsg.includes('not available')) {
        alert('❌ This match is no longer available to join.')
        loadMatches()
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        alert('❌ Network error\n\nPlease check your connection and try again.')
      } else {
        alert(`❌ Failed to join match\n\n${errorMsg}`)
      }
    } finally {
      setJoiningMatchId(null)
    }
  }

  const getStatusBadge = (match: MatchProps) => {
  const isMyMatch = match.creator.username === name
  
  if (match.status === 'WAITING') {
    return (
      <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${
        isMyMatch ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30' : 'bg-green-400/20 text-green-300 border border-green-400/30'
      }`}>
        {isMyMatch ? '⏳ WAITING' : '🟢 OPEN'}
      </div>
    )
  }
  if (match.status === 'PLAYING') {
    return (
      <div className="bg-blue-400/20 text-blue-300 border border-blue-400/30 px-4 py-1.5 rounded-full text-xs font-bold">
        ⚔️ LIVE
      </div>
    )
  }
  if (match.status === 'FINISHED') {
    return (
      <div className="bg-green-400/20 text-green-300 border border-green-400/30 px-4 py-1.5 rounded-full text-xs font-bold">
        🏆 {match.winner === 'DRAW' ? 'DRAW' : match.winner}
      </div>
    )
  }
}

  return (
    <div className="min-h-screen  bg-zinc-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-blue-900/40">
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
          <div className="absolute top-40 right-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent transform rotate-12" />
          <div className="absolute top-60 right-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent transform rotate-12" />
        </div>

        <div className="relative container mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Game Card & Info */}
            <div className="space-y-8 z-10">
              {/* Game Card */}
              <div className="flex group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative w-42 h-58 bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-purple-500/30 rounded-2xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=600&q=80"
                    alt="Chess"
                    className="w-42 h-58 object-cover"
                  />
                </div>
                <div>
                <div className="flex items-center gap-2 ml-4 mb-4">
                  <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    BETA
                  </span>
                  <span className="text-purple-400 text-sm font-semibold">Season 1</span>
                </div>
                <h1 className="text-4xl  font-black text-white leading-tight ml-4 mb-4">
                  COMPETE IN<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                    CHESS BATTLES
                  </span>
                </h1>
                <p className="text-purple-200 text-lg ml-4 mb-6">
                  Wager SOL and compete against players worldwide
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
                  <div className="text-xs text-purple-300 font-semibold">ACTIVE MATCHES</div>
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
              {/* Create Match Form */}
              <div className="bg-zinc-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 space-y-4">
                <input
                  placeholder="Enter your username"
                  className="bg-zinc-800 border-2 border-zinc-700 text-white placeholder-zinc-500 p-3 rounded-lg w-full focus:outline-none focus:border-purple-500 transition-colors"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-purple-300 font-semibold mb-1 block">WAGER AMOUNT</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.001"
                      placeholder="0.1"
                      className="bg-zinc-800 border-2 border-zinc-700 text-white p-3 rounded-lg w-full focus:outline-none focus:border-purple-500 transition-colors"
                      value={wagerAmount}
                      onChange={(e) => setWagerAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-green-400 font-semibold mb-1 block">WINNER GETS</label>
                    <div className="bg-zinc-800 border-2 border-green-500/30 text-green-400 p-3 rounded-lg font-bold text-center">
                      {(wagerAmount * 2 * 0.95).toFixed(3)} SOL
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={onCreateMatch}
                  disabled={!name || loading || wagerAmount <= 0}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-lg font-black text-lg w-full disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                >
                  {loading ? '⏳ CREATING...' : '⚡ CREATE MATCH'}
                </button>

                <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-400">
                  <p className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    5% platform fee • Winner takes {((wagerAmount * 2 * 0.95) / (wagerAmount * 2) * 100).toFixed(0)}% of pot
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Character/Visual */}
            <div className="relative h-[500px] lg:h-[600px] z-10">
              {/* Main Chess Piece Image */}
              <div className="absolute right-0 bottom-0 w-full h-full">
                <img 
                  src="https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&q=80"
                  alt="Chess Pieces"
                  className="absolute right-0 bottom-0 h-full w-auto object-contain drop-shadow-[0_0_50px_rgba(168,85,247,0.4)]"
                />
              </div>

              {/* Floating Stats Card */}
              <div className="absolute top-20 left-0 bg-black/80 backdrop-blur-md border border-purple-500/30 px-6 py-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-yellow-400" />
                  <div>
                    <div className="text-3xl font-black text-white">#{name ? '125' : '---'}</div>
                    <div className="text-xs text-purple-300 font-semibold">YOUR RANK</div>
                  </div>
                </div>
              </div>

              {/* Floating Active Match Indicator */}
              <div className="absolute bottom-32 right-10 bg-black/80 backdrop-blur-md border border-blue-500/30 px-6 py-3 rounded-xl animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-ping absolute" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                  <span className="text-white font-bold ml-2">LIVE MATCHES</span>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-white">OPEN MATCHES</h2>
          <button className="text-purple-400 hover:text-purple-300 text-sm font-bold flex items-center gap-2">
            🔄 REFRESH
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matches.map((match) => {
            const isMyMatch = match.creator.username === name;
            const isJoined = match.joiner?.username === name;
            
            return (
              <div 
                key={match.id}
                className="group relative"
              >
                {/* Glow Effect */}
                <div className={`absolute inset-0 rounded-xl blur-xl transition-all ${
                  match.status === 'PLAYING' 
                    ? 'bg-blue-500/20 group-hover:bg-blue-500/30' 
                    : 'bg-purple-500/20 group-hover:bg-purple-500/30'
                }`} />
                
                {/* Card */}
                <div className={`relative bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 rounded-xl p-6 transition-all ${
                  match.status === 'PLAYING'
                    ? 'border-blue-500/30 hover:border-blue-500/50'
                    : 'border-purple-500/30 hover:border-purple-500/50'
                }`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-xl font-black text-white">
                          {isMyMatch ? '👤 YOUR MATCH' : `🎮 ${match.creator.username.toUpperCase()}`}
                        </div>
                        {getStatusBadge(match)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-purple-300">
                          🎨 <span className="font-mono bg-zinc-800 px-2 py-1 rounded">{match.creatorColor?.toUpperCase()}</span>
                        </span>
                        {match.joinerColor && (
                          <span className="text-purple-300">
                            vs <span className="font-mono bg-zinc-800 px-2 py-1 rounded">{match.joinerColor?.toUpperCase()}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Wager Badge */}
                    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-4 py-2 rounded-lg">
                      <div className="text-yellow-400 text-xs font-bold mb-1">WAGER</div>
                      <div className="text-white font-black text-lg">{match.wager} SOL</div>
                    </div>
                  </div>

                  {/* Prize Pool */}
                  <div className="bg-zinc-800/50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-xs font-semibold">PRIZE POOL</span>
                      <span className="text-green-400 font-black text-lg">{(match.wager * 2 * 0.95).toFixed(3)} SOL</span>
                    </div>
                  </div>

                  {/* Game Info */}
                  {match.gameId && (
                    <div className="text-xs text-zinc-500 mb-4 font-mono">
                      ID: {match.gameId}
                    </div>
                  )}

                  {/* Joiner Info */}
                  {match.joiner && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-blue-300">
                        <Sword className="w-4 h-4" />
                        <strong>{match.joiner.username}</strong> joined the battle
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
  {match.status === 'WAITING' && !isMyMatch && !isJoined && (
    <button 
      onClick={() => onJoinMatch(match)}
      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-lg font-black transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40"
    >
      ⚡ JOIN BATTLE
    </button>
  )}
  
  {match.status === 'PLAYING' && match.url && (
    <button 
      onClick={() => {
        setPendingGameUrl(match.url!);
        setShowGameModal(true);
      }}
      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-lg font-black transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center gap-2"
    >
      <Eye className="w-5 h-5" />
      SPECTATE
    </button>
  )}

  {match.url && (
    <button 
      onClick={() => {
        setPendingGameUrl(match.url!);
        setShowGameModal(true);
      }}
      className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-3 rounded-lg font-bold transition-all"
    >
      🔗
    </button>
  )}
</div>
                </div>
              </div>
            );
          })}
        </div>

        {matches.length === 0 && (
          <div className="border-2 border-dashed border-zinc-800 rounded-xl p-16 text-center">
            <div className="text-8xl mb-6">♟️</div>
            <p className="text-zinc-500 text-xl font-bold mb-2">NO ACTIVE MATCHES</p>
            <p className="text-zinc-600">Be the first to create one!</p>
          </div>
        )}
      </div>

      {/* Game Modal */}
      {showGameModal && pendingGameUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-purple-500/30 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-3xl font-black text-white mb-4 text-center">
              🎮 GAME READY!
            </h2>
            <p className="text-center mb-6 text-zinc-400">
              Your chess match is ready to play
            </p>
            <div className="space-y-3">
              <a
                href={pendingGameUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-4 rounded-lg text-center font-black transition-all text-lg"
                onClick={() => {
                  setShowGameModal(false);
                  setPendingGameUrl(null);
                }}
              >
                🚀 OPEN GAME
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pendingGameUrl);
                  alert('✅ URL copied!');
                }}
                className="block w-full bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg text-center font-bold transition-all"
              >
                📋 COPY URL
              </button>
              <button
                onClick={() => {
                  setShowGameModal(false);
                  setPendingGameUrl(null);
                }}
                className="block w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-6 py-2 rounded-lg text-center transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChessInterface