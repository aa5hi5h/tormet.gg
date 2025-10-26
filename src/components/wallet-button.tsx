"use client"
import { useState, useEffect } from "react"
import { 
  connectWallet, 
  disconnectWallet, 
  getConnectedWallet,
  getWalletBalance,
  formatWalletAddress 
} from "@/lib/wallet-integration"
import { createMatchWithEscrow as createEscrow } from "@/lib/wallet-integration"
import { createMatchWithEscrow } from "../lib/server-action/mian"
import { joinMatchWithEscrow } from "@/lib/server-action/mian"


export default function WalletButton() {
  const [wallet, setWallet] = useState<string | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if wallet is already connected
    const connectedWallet = getConnectedWallet()
    if (connectedWallet) {
      setWallet(connectedWallet)
      loadBalance(connectedWallet)
    }

    // Listen for wallet changes
    if (window.solana) {
      window.solana.on('connect', () => {
        const pubKey = window.solana.publicKey?.toString()
        setWallet(pubKey)
        loadBalance(pubKey)
      })

      window.solana.on('disconnect', () => {
        setWallet(null)
        setBalance(0)
      })
    }
  }, [])

  const loadBalance = async (walletAddress: string) => {
    const bal = await getWalletBalance(walletAddress)
    setBalance(bal)
  }

  const handleConnect = async () => {
    setLoading(true)
    const result = await connectWallet()
    
    if (result.success && result.publicKey) {
      setWallet(result.publicKey)
      loadBalance(result.publicKey)
    } else {
      alert(result.error)
    }
    setLoading(false)
  }

  const handleDisconnect = async () => {
    await disconnectWallet()
    setWallet(null)
    setBalance(0)
  }

  if (wallet) {
    return (
      <div className="flex items-center gap-3 bg-white/10 rounded-lg px-4 py-2">
        <div className="text-sm">
          <div className="font-semibold">{formatWalletAddress(wallet)}</div>
          <div className="text-xs text-gray-400">{balance.toFixed(4)} SOL</div>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
    >
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}


export function useMatchCreationWithEscrow() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const createMatch = async (
    username: string,
    gameType: string,
    wagerAmount: number,
    gameSpecificData: any
  ) => {
    setLoading(true)
    setError('')

    try {
      const walletAddress = getConnectedWallet()
      if (!walletAddress) {
        throw new Error('Please connect your wallet first')
      }

      const escrowResult = await createEscrow(wagerAmount)
      
      if (!escrowResult.success) {
        throw new Error(escrowResult.error || 'Escrow failed')
      }

      console.log('✅ Escrow TX:', escrowResult.txHash)

      const match = await createMatchWithEscrow(
        username,
        gameType,
        wagerAmount,
        walletAddress,
        escrowResult.txHash!,
        gameSpecificData
      )

      console.log('✅ Match created:', match.id)

      setLoading(false)
      return { success: true, match }

    } catch (err: any) {
      setError(err.message || 'Failed to create match')
      setLoading(false)
      return { success: false, error: err.message }
    }
  }

  return { createMatch, loading, error }
}

export function useJoinMatchWithEscrow() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const joinMatch = async (
    matchId: string,
    username: string,
    wagerAmount: number,
    gameSpecificData: any
  ) => {
    setLoading(true)
    setError('')

    try {
      // Step 1: Get connected wallet
      const walletAddress = getConnectedWallet()
      if (!walletAddress) {
        throw new Error('Please connect your wallet first')
      }

      // Step 2: Create escrow transaction
      const escrowResult = await createEscrow(wagerAmount)
      
      if (!escrowResult.success) {
        throw new Error(escrowResult.error || 'Escrow failed')
      }

      console.log('✅ Escrow TX:', escrowResult.txHash)

      // Step 3: Join match in database
      const match = await joinMatchWithEscrow(
        matchId,
        username,
        walletAddress,
        escrowResult.txHash!,
        gameSpecificData
      )

      console.log('✅ Joined match:', match.id)

      setLoading(false)
      return { success: true, match }

    } catch (err: any) {
      setError(err.message || 'Failed to join match')
      setLoading(false)
      return { success: false, error: err.message }
    }
  }

  return { joinMatch, loading, error }
}