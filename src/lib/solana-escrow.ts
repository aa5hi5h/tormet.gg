import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair
} from '@solana/web3.js'


const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const connection = new Connection(SOLANA_RPC_URL, 'confirmed')


const PLATFORM_WALLET = new PublicKey(process.env.NEXT_PUBLIC_PLATFORM_WALLET || '')
const PLATFORM_FEE_PERCENT = 5 // 5% platform fee



export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL)
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL
}

export async function getBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey)
    return lamportsToSol(balance)
  } catch (error) {
    console.error('Error getting balance:', error)
    return 0
  }
}


/**
 * Create escrow transaction - Players send wager to platform wallet
 */
export async function createEscrowTransaction(
  playerWallet: PublicKey,
  wagerAmount: number 
): Promise<Transaction> {
  try {
    const lamports = solToLamports(wagerAmount)
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: playerWallet,
        toPubkey: PLATFORM_WALLET,
        lamports: lamports
      })
    )


    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = playerWallet

    return transaction
  } catch (error) {
    console.error('Error creating escrow transaction:', error)
    throw new Error('Failed to create escrow transaction')
  }
}

/**
 * Process match creation with escrow
 */
export async function processMatchCreation(
  playerWallet: string,
  wagerAmount: number,
  matchId: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const playerPubkey = new PublicKey(playerWallet)
    

    const balance = await getBalance(playerWallet)
    if (balance < wagerAmount) {
      return {
        success: false,
        error: `Insufficient balance. You have ${balance.toFixed(4)} SOL but need ${wagerAmount} SOL`
      }
    }

    
    const transaction = await createEscrowTransaction(playerPubkey, wagerAmount)
    

    return {
      success: true,
      txHash: 'pending' 
    }
  } catch (error: any) {
    console.error('Error processing match creation:', error)
    return {
      success: false,
      error: error.message || 'Failed to process match creation'
    }
  }
}

/**
 * Process player joining match with escrow
 */
export async function processMatchJoin(
  playerWallet: string,
  wagerAmount: number,
  matchId: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const playerPubkey = new PublicKey(playerWallet)
    
    const balance = await getBalance(playerWallet)
    if (balance < wagerAmount) {
      return {
        success: false,
        error: `Insufficient balance. You have ${balance.toFixed(4)} SOL but need ${wagerAmount} SOL`
      }
    }

    const transaction = await createEscrowTransaction(playerPubkey, wagerAmount)
    
    return {
      success: true,
      txHash: 'pending'
    }
  } catch (error: any) {
    console.error('Error processing match join:', error)
    return {
      success: false,
      error: error.message || 'Failed to process match join'
    }
  }
}

// ==================== PAYOUT FUNCTIONS ====================

/**
 * Calculate payout amounts
 */
export function calculatePayout(totalWager: number): {
  winnerAmount: number
  platformFee: number
  totalPayout: number
} {
  const platformFee = totalWager * (PLATFORM_FEE_PERCENT / 100)
  const winnerAmount = totalWager - platformFee
  
  return {
    winnerAmount: parseFloat(winnerAmount.toFixed(4)),
    platformFee: parseFloat(platformFee.toFixed(4)),
    totalPayout: totalWager
  }
}

/**
 * Create payout transaction - Send winnings from platform wallet to winner
 * NOTE: This requires the platform wallet's private key (server-side only)
 */
export async function createPayoutTransaction(
  winnerWallet: PublicKey,
  amount: number // in SOL
): Promise<Transaction> {
  try {
    const lamports = solToLamports(amount)
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: PLATFORM_WALLET,
        toPubkey: winnerWallet,
        lamports: lamports
      })
    )

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = PLATFORM_WALLET

    return transaction
  } catch (error) {
    console.error('Error creating payout transaction:', error)
    throw new Error('Failed to create payout transaction')
  }
}

/**
 * Process winner payout (SERVER-SIDE ONLY)
 * This should be called from a secure API route with platform wallet private key
 */
export async function processWinnerPayout(
  winnerWallet: string,
  totalWager: number,
  matchId: string,
  platformKeypair: Keypair // Should be loaded securely on server
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const winnerPubkey = new PublicKey(winnerWallet)
    const { winnerAmount, platformFee } = calculatePayout(totalWager)

    console.log(`💰 Processing payout for match ${matchId}`)
    console.log(`   Winner: ${winnerWallet}`)
    console.log(`   Amount: ${winnerAmount} SOL`)
    console.log(`   Platform Fee: ${platformFee} SOL`)

    const transaction = await createPayoutTransaction(winnerPubkey, winnerAmount)
    
    transaction.sign(platformKeypair)

    const signature = await connection.sendRawTransaction(transaction.serialize())
    
    await connection.confirmTransaction(signature, 'confirmed')

    console.log(`✅ Payout successful! TX: ${signature}`)

    return {
      success: true,
      txHash: signature
    }
  } catch (error: any) {
    console.error('Error processing payout:', error)
    return {
      success: false,
      error: error.message || 'Failed to process payout'
    }
  }
}

/**
 * Process refund in case of match cancellation
 */
export async function processRefund(
  playerWallet: string,
  amount: number,
  matchId: string,
  platformKeypair: Keypair
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const playerPubkey = new PublicKey(playerWallet)

    console.log(`🔄 Processing refund for match ${matchId}`)
    console.log(`   Player: ${playerWallet}`)
    console.log(`   Amount: ${amount} SOL`)

    const transaction = await createPayoutTransaction(playerPubkey, amount)
    transaction.sign(platformKeypair)

    const signature = await connection.sendRawTransaction(transaction.serialize())
    await connection.confirmTransaction(signature, 'confirmed')

    console.log(`✅ Refund successful! TX: ${signature}`)

    return {
      success: true,
      txHash: signature
    }
  } catch (error: any) {
    console.error('Error processing refund:', error)
    return {
      success: false,
      error: error.message || 'Failed to process refund'
    }
  }
}

/**
 * Handle draw - Split pot equally (minus platform fee)
 */
export async function processDrawPayout(
  player1Wallet: string,
  player2Wallet: string,
  totalWager: number,
  matchId: string,
  platformKeypair: Keypair
): Promise<{ success: boolean; txHashes?: string[]; error?: string }> {
  try {
    const player1Pubkey = new PublicKey(player1Wallet)
    const player2Pubkey = new PublicKey(player2Wallet)
    
    const { winnerAmount, platformFee } = calculatePayout(totalWager)
    const splitAmount = winnerAmount / 2

    console.log(`🤝 Processing draw payout for match ${matchId}`)
    console.log(`   Total: ${totalWager} SOL`)
    console.log(`   Each Player: ${splitAmount} SOL`)
    console.log(`   Platform Fee: ${platformFee} SOL`)

    // Payout to player 1
    const tx1 = await createPayoutTransaction(player1Pubkey, splitAmount)
    tx1.sign(platformKeypair)
    const sig1 = await connection.sendRawTransaction(tx1.serialize())

    // Payout to player 2
    const tx2 = await createPayoutTransaction(player2Pubkey, splitAmount)
    tx2.sign(platformKeypair)
    const sig2 = await connection.sendRawTransaction(tx2.serialize())

    // Confirm both
    await Promise.all([
      connection.confirmTransaction(sig1, 'confirmed'),
      connection.confirmTransaction(sig2, 'confirmed')
    ])

    console.log(`✅ Draw payouts successful! TX1: ${sig1}, TX2: ${sig2}`)

    return {
      success: true,
      txHashes: [sig1, sig2]
    }
  } catch (error: any) {
    console.error('Error processing draw payout:', error)
    return {
      success: false,
      error: error.message || 'Failed to process draw payout'
    }
  }
}

// ==================== TRANSACTION VERIFICATION ====================

export async function verifyTransaction(signature: string): Promise<boolean> {
  try {
    const status = await connection.getSignatureStatus(signature)
    return status?.value?.confirmationStatus === 'confirmed' || 
           status?.value?.confirmationStatus === 'finalized'
  } catch (error) {
    console.error('Error verifying transaction:', error)
    return false
  }
}

export async function getTransactionDetails(signature: string) {
  try {
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    })
    return transaction
  } catch (error) {
    console.error('Error getting transaction details:', error)
    return null
  }
}