"use client"
import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js'


declare global {
  interface Window {
    solana?: any
  }
}

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const connection = new Connection(SOLANA_RPC_URL, 'confirmed')
const PLATFORM_WALLET = new PublicKey(process.env.NEXT_PUBLIC_PLATFORM_WALLET || '')

export async function connectWallet(): Promise<{ 
  success: boolean
  publicKey?: string
  error?: string 
}> {
  try {
    if (!window.solana) {
      return {
        success: false,
        error: 'Please install Phantom wallet or Solflare'
      }
    }

    const response = await window.solana.connect()
    const publicKey = response.publicKey.toString()

    console.log('✅ Wallet connected:', publicKey)

    return {
      success: true,
      publicKey
    }
  } catch (error: any) {
    console.error('Error connecting wallet:', error)
    return {
      success: false,
      error: error.message || 'Failed to connect wallet'
    }
  }
}

export async function disconnectWallet(): Promise<void> {
  try {
    if (window.solana) {
      await window.solana.disconnect()
      console.log('👋 Wallet disconnected')
    }
  } catch (error) {
    console.error('Error disconnecting wallet:', error)
  }
}

export function getConnectedWallet(): string | null {
  try {
    if (window.solana?.isConnected && window.solana.publicKey) {
      return window.solana.publicKey.toString()
    }
    return null
  } catch (error) {
    return null
  }
}

export async function getWalletBalance(walletAddress?: string): Promise<number> {
  try {
    const address = walletAddress || getConnectedWallet()
    if (!address) return 0

    const publicKey = new PublicKey(address)
    const balance = await connection.getBalance(publicKey)
    return balance / LAMPORTS_PER_SOL
  } catch (error) {
    console.error('Error getting wallet balance:', error)
    return 0
  }
}


export async function createMatchWithEscrow(
  wagerAmount: number
): Promise<{
  success: boolean
  txHash?: string
  error?: string
}> {
  try {
    if (!window.solana?.isConnected) {
      return {
        success: false,
        error: 'Please connect your wallet first'
      }
    }

    const playerPublicKey = window.solana.publicKey
    const lamports = Math.floor(wagerAmount * LAMPORTS_PER_SOL)

    const balance = await getWalletBalance()
    if (balance < wagerAmount) {
      return {
        success: false,
        error: `Insufficient balance. You have ${balance.toFixed(4)} SOL but need ${wagerAmount} SOL`
      }
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: playerPublicKey,
        toPubkey: PLATFORM_WALLET,
        lamports: lamports
      })
    )

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = playerPublicKey

    const { signature } = await window.solana.signAndSendTransaction(transaction)

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


export function formatWalletAddress(address: string): string {
  if (address.length <= 8) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export function solToUSD(sol: number, solPrice: number = 100): string {
  return (sol * solPrice).toFixed(2)
}



/**
 * Call this after match finishes to trigger payout
 */
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