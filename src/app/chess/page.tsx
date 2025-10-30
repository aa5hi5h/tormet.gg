"use client"
import axios from "axios"
import { useState, useEffect, useRef } from "react"
import { checkAndUpdateGameResults, getAllActiveMatches, getOpenMatches } from "../../lib/server-action/mian"
import WalletButton, { useJoinMatchWithEscrow, useMatchCreationWithEscrow } from "@/components/wallet-button"

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
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isMyMatch ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'
        }`}>
          {isMyMatch ? '⏳ Waiting for opponent...' : '🟢 Available'}
        </span>
      )
    }
    if (match.status === 'PLAYING') {
      return (
        <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
          ♟️ Game in progress
        </span>
      )
    }
    if (match.status === 'FINISHED') {
      return (
        <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
          🏆 Winner: {match.winner === 'DRAW' ? 'Draw' : match.winner}
        </span>
      )
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl p-6 mx-auto">
      {/* Game Ready Modal */}
      {showGameModal && pendingGameUrl && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-center">🎮 Game Ready!</h2>
            <p className="text-center mb-6 text-gray-700">
              Your chess match is ready to play!
            </p>
            <div className="space-y-3">
              <a
                href={pendingGameUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-600 text-white px-6 py-4 rounded-lg text-center font-semibold hover:bg-green-700 transition text-lg"
                onClick={() => {
                  setShowGameModal(false)
                  setPendingGameUrl(null)
                }}
              >
                🚀 Open Game in New Tab
              </a>
              <button
                onClick={() => {
                  window.location.href = pendingGameUrl
                }}
                className="block w-full bg-blue-600 text-white px-6 py-4 rounded-lg text-center font-semibold hover:bg-blue-700 transition"
              >
                🔗 Open Game Here
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pendingGameUrl)
                  alert('✅ URL copied to clipboard!')
                }}
                className="block w-full bg-gray-600 text-white px-6 py-3 rounded-lg text-center font-semibold hover:bg-gray-700 transition"
              >
                📋 Copy Game URL
              </button>
              <button
                onClick={() => {
                  setShowGameModal(false)
                  setPendingGameUrl(null)
                }}
                className="block w-full bg-gray-300 text-gray-800 px-6 py-2 rounded-lg text-center hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center break-all">
              URL: {pendingGameUrl}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <a href="/" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
          ← Back
        </a>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4">
        <h2 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <span className="text-xl">ℹ️</span> How it works:
        </h2>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside ml-2">
          <li>Connect your wallet first (Phantom/Backpack)</li>
          <li>Enter username and set wager amount</li>
          <li>Create match - approve wallet transaction to deposit SOL</li>
          <li>Stay on page - auto-redirect when opponent joins</li>
          <li>Play on Lichess - winner gets full pot automatically!</li>
        </ol>
      </div>

      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">Chess Wagering</h1>
        {myActiveMatches.length > 0 && (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
            🎮 {myActiveMatches.length} active match{myActiveMatches.length > 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {(createError || joinError) && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          ⚠️ {createError || joinError}
        </div>
      )}
      
      <div className="space-y-3">
        <input
          placeholder="Enter your username"
          className="border-2 border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:border-blue-500 transition-colors"
          value={name}
          onChange={(e) => setName(e.target.value)} 
        />
        
        <div className="flex items-center gap-3">
          <label className="font-semibold text-gray-700">Wager (SOL):</label>
          <input
            type="number"
            step="0.01"
            min="0.001"
            placeholder="0.1"
            className="border-2 border-gray-300 p-3 rounded-lg w-32 focus:outline-none focus:border-blue-500 transition-colors"
            value={wagerAmount}
            onChange={(e) => setWagerAmount(parseFloat(e.target.value) || 0)}
          />
          <span className="text-sm text-gray-600">
            Winner gets: <strong className="text-green-600">{(wagerAmount * 2 * 0.95).toFixed(3)} SOL</strong> (5% fee)
          </span>
        </div>
        
        <button 
          onClick={onCreateMatch} 
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg cursor-pointer hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-bold shadow-md hover:shadow-lg transition-all w-full"
          disabled={!name || loading || creatingMatch || wagerAmount <= 0}
        >
          {loading || creatingMatch ? '⏳ Creating & Depositing...' : `✨ Create Match (Deposit ${wagerAmount} SOL)`}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Available Matches</h2>
        <button
          onClick={loadMatches}
          disabled={loading || creatingMatch || joiningMatch}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 disabled:text-gray-400"
        >
          🔄 Refresh
        </button>
        <span className="text-sm text-gray-500">
          Auto-refreshing every 5s
        </span>
      </div>
      
      <div className="space-y-3">
        {matches.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50">
            <div className="text-6xl mb-4">♟️</div>
            <p className="text-gray-500 text-lg">No matches available</p>
            <p className="text-gray-400 text-sm mt-2">Create the first one!</p>
          </div>
        ) : (
          matches.map((match) => {
            const isMyMatch = match.creator.username === name
            const isJoined = match.joiner?.username === name
            const isJoiningThis = joiningMatchId === match.id
            
            return (
              <div 
                key={match.id} 
                className={`border-2 p-5 rounded-xl shadow-sm hover:shadow-md transition-all ${
                  isMyMatch 
                    ? 'border-orange-300 bg-orange-50' 
                    : isJoined
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-bold text-xl">
                        {isMyMatch ? '👤 Your Match' : isJoined ? '✅ Joined Match' : `🎮 ${match.creator.username}'s Match`}
                      </p>
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                        💰 {match.wager} SOL
                      </span>
                      {isMyMatch && match.status === 'WAITING' && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full animate-pulse">
                          Waiting...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <span>
                        🎨 Creator: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{match.creatorColor?.toUpperCase() || '?'}</span>
                      </span>
                      {match.joinerColor && (
                        <span>
                          🎨 Joiner: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{match.joinerColor?.toUpperCase() || '?'}</span>
                        </span>
                      )}
                    </div>
                    {match.gameId && (
                      <p className="text-sm text-gray-600 mt-1">
                        Game ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{match.gameId}</code>
                      </p>
                    )}
                    {match.joiner && (
                      <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                        <span>⚔️</span>
                        <strong>{match.joiner.username}</strong> joined
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Prize pool: <strong className="text-green-600">{(match.wager * 2 * 0.95).toFixed(3)} SOL</strong> (5% platform fee)
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 items-end">
                    {getStatusBadge(match)}
                    
                    {match.status === 'WAITING' && !isMyMatch && !isJoined && (
                      <button 
                        onClick={() => onJoinMatch(match)}
                        disabled={joiningMatch || isJoiningThis || joiningMatchId !== null}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 font-bold shadow-md hover:shadow-lg transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
                      >
                        {isJoiningThis ? '⏳ Joining...' : `⚡ Join (Deposit ${match.wager} SOL)`}
                      </button>
                    )}
                    
                    {match.status === 'WAITING' && isMyMatch && match.url && (
                      <button 
                        onClick={() => {
                          setPendingGameUrl(match.url!)
                          setShowGameModal(true)
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold text-sm"
                      >
                        🔗 Open Lichess Link
                      </button>
                    )}
                    
                    {match.status === 'PLAYING' && match.url && (
                      <button 
                        onClick={() => {
                          setPendingGameUrl(match.url!)
                          setShowGameModal(true)
                        }}
                        className="bg-blue-500 text-white px-5 py-3 rounded-lg hover:bg-blue-600 font-semibold"
                      >
                        👀 Watch Game
                      </button>
                    )}
                    
                    {match.status === 'FINISHED' && match.url && (
                      <button 
                        onClick={() => {
                          setPendingGameUrl(match.url!)
                          setShowGameModal(true)
                        }}
                        className="bg-gray-500 text-white px-5 py-3 rounded-lg hover:bg-gray-600 font-semibold"
                      >
                        📊 View Results
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ChessInterface