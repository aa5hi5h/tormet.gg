"use client"
import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'

declare global {
  interface Window {
    solana?: any
  }
}

const PLATFORM_WALLET = new PublicKey(process.env.NEXT_PUBLIC_PLATFORM_WALLET || '')
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr")


export function formatWalletAddress(address: string): string {
  if (address.length <= 8) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export function solToUSD(sol: number, solPrice: number = 100): string {
  return (sol * solPrice).toFixed(2)
}

export async function getWalletBalance(
  connection: Connection,
  walletAddress: string
): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey)
    return balance / LAMPORTS_PER_SOL
  } catch (error) {
    console.error('Error getting wallet balance:', error)
    return 0
  }
}

export async function createEscrowTransaction(
  connection: Connection,
  publicKey: PublicKey,
  sendTransaction: any,
  wagerAmount: number
): Promise<{
  success: boolean
  txHash?: string
  error?: string
}> {
  try {
    const lamports = Math.floor(wagerAmount * LAMPORTS_PER_SOL)

    const balance = await getWalletBalance(connection, publicKey.toString())
    if (balance < wagerAmount) {
      return {
        success: false,
        error: `Insufficient balance. You have ${balance.toFixed(4)} SOL but need ${wagerAmount} SOL`
      }
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: PLATFORM_WALLET,
        lamports: lamports
      })
    )
    const signature = await sendTransaction(transaction, connection)

    console.log('⏳ Confirming transaction...')
    await connection.confirmTransaction(signature, 'confirmed')

    console.log('✅ Escrow transaction confirmed:', signature)

    return {
      success: true,
      txHash: signature
    }
  } catch (error: any) {
    console.error('Error creating escrow:', error)
    return {
      success: false,
      error: error.message || 'Failed to create escrow transaction'
    }
  }
}

export async function triggerPayout(matchId: string): Promise<{
  success: boolean
  txHash?: string | string[]
  error?: string
}> {
  try {
    const response = await fetch('/api/payout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ matchId })
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to process payout'
      }
    }

    return {
      success: true,
      txHash: data.txHash,
      ...data
    }
  } catch (error: any) {
    console.error('Error triggering payout:', error)
    return {
      success: false,
      error: error.message || 'Failed to trigger payout'
    }
  }
}