"use client"
import { useState, useEffect } from "react"
import { 
  getWalletBalance,
  formatWalletAddress, 
  createEscrowTransaction
} from "@/lib/wallet-integration"
import { createMatchWithEscrow } from "../lib/server-action/mian"
import { joinMatchWithEscrow } from "@/lib/server-action/mian"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"

export default function WalletButton() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState<number>(0)

  useEffect(() => {
    if (connected && publicKey) {
      loadBalance()
    }
  }, [connected, publicKey])

  const loadBalance = async () => {
    if (publicKey) {
      const bal = await getWalletBalance(connection, publicKey.toString())
      setBalance(bal)
    }
  }

  if (connected && publicKey) {
    return (
      <WalletMultiButton className="!bg-red-500/20 hover:!bg-red-500/30 !px-3 !py-1 !text-xs !rounded" />
    )
  }

  return <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-500 hover:!from-purple-600 hover:!to-pink-600" />
}

export function useMatchCreationWithEscrow() {
  const { publicKey, sendTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const createMatch = async (
    username: string,
    gameType: string,
    wagerAmount: number,
    gameSpecificData?: any
  ) => {
    setLoading(true)
    setError('')

    try {
      if (!connected || !publicKey) {
        throw new Error('WALLET_NOT_CONNECTED')
      }

      console.log('💰 Starting escrow transaction...')

      const escrowResult = await createEscrowTransaction(
        connection,
        publicKey,
        sendTransaction,
        wagerAmount
      )
      
      if (!escrowResult.success) {
        // Handle specific errors
        if (escrowResult.error === 'WALLET_CANCELLED') {
          throw new Error('WALLET_CANCELLED')
        }
        if (escrowResult.error === 'INSUFFICIENT_FUNDS') {
          throw new Error('INSUFFICIENT_FUNDS')
        }
        throw new Error(escrowResult.error || 'Escrow failed')
      }

      console.log('✅ Escrow TX:', escrowResult.txHash)
      console.log('📡 Creating match in database...')

      const match = await createMatchWithEscrow(
        username,
        gameType,
        wagerAmount,
        publicKey.toString(),
        escrowResult.txHash!,
        gameSpecificData
      )

      console.log('✅ Match created:', match.id)

      setLoading(false)
      return { success: true, match }

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create match'
      console.error('❌ Create match error:', errorMsg)
      setError(errorMsg)
      setLoading(false)
      return { success: false, error: errorMsg }
    }
  }

  return { createMatch, loading, error }
}

export function useJoinMatchWithEscrow() {
  const { publicKey, sendTransaction, connected } = useWallet()
  const { connection } = useConnection()
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
      if (!connected || !publicKey) {
        throw new Error('WALLET_NOT_CONNECTED')
      }

      console.log('💰 Starting escrow transaction...')

      const escrowResult = await createEscrowTransaction(
        connection,
        publicKey,
        sendTransaction,
        wagerAmount
      )
      
      if (!escrowResult.success) {
        // Handle specific errors
        if (escrowResult.error === 'WALLET_CANCELLED') {
          throw new Error('WALLET_CANCELLED')
        }
        if (escrowResult.error === 'INSUFFICIENT_FUNDS') {
          throw new Error('INSUFFICIENT_FUNDS')
        }
        throw new Error(escrowResult.error || 'Escrow failed')
      }

      console.log('✅ Escrow TX:', escrowResult.txHash)
      console.log('📡 Joining match in database...')

      const match = await joinMatchWithEscrow(
        matchId,
        username,
        publicKey.toString(),
        escrowResult.txHash!,
        gameSpecificData
      )

      console.log('✅ Joined match:', match.id)
      console.log('🔗 Match URL from DB:', match.url)
      console.log('📦 Full match object:', JSON.stringify(match, null, 2))

      setLoading(false)
      return { success: true, match }

    } catch (err: any) {
      const errorMsg = err.message || 'Failed to join match'
      console.error('❌ Join match error:', errorMsg)
      setError(errorMsg)
      setLoading(false)
      return { success: false, error: errorMsg }
    }
  }

  return { joinMatch, loading, error }
}