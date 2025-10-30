import { NextRequest, NextResponse } from 'next/server'
import { Keypair } from '@solana/web3.js'
import { 
  processWinnerPayout, 
  processDrawPayout,
  processRefund 
} from '@/lib/solana-escrow'
import { prisma } from '@/lib/prisma'

function getPlatformKeypair(): Keypair {
  const privateKeyString = process.env.PLATFORM_WALLET_PRIVATE_KEY
  if (!privateKeyString) {
    throw new Error('Platform wallet private key not configured')
  }
  
  const privateKeyArray = JSON.parse(privateKeyString)
  return Keypair.fromSecretKey(Uint8Array.from(privateKeyArray))
}

export async function POST(request: NextRequest) {
  try {
    const { matchId } = await request.json()

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID required' },
        { status: 400 }
      )
    }

    // Get match details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        creator: true,
        joiner: true
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Check if match is finished
    if (match.status !== 'FINISHED') {
      return NextResponse.json(
        { error: 'Match is not finished yet' },
        { status: 400 }
      )
    }

    if (match.payoutTxHash) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Payout already processed',
          txHash: match.payoutTxHash 
        },
        { status: 200 }
      )
    }

    if (!match.creator.wallet || !match.joiner?.wallet) {
      return NextResponse.json(
        { error: 'Player wallets not found' },
        { status: 400 }
      )
    }

    const platformKeypair = getPlatformKeypair()
    const totalPot = match.wager * 2

    console.log(`💰 Processing payout for match ${matchId}`)
    console.log(`   Total Pot: ${totalPot} SOL (${match.wager} x 2)`)
    console.log(`   Winner from DB: ${match.winner}`)
    console.log(`   Creator: ${match.creator.username} (${match.creatorColor}) - ${match.creator.wallet}`)
    console.log(`   Joiner: ${match.joiner.username} (${match.joinerColor}) - ${match.joiner.wallet}`)

    let payoutResult: { success: boolean; txHash?: string; txHashes?: string[]; error?: string }

    if (match.winner === 'DRAW') {
      console.log('   🤝 Processing DRAW payout')
      
      payoutResult = await processDrawPayout(
        match.creator.wallet,
        match.joiner.wallet,
        totalPot,
        matchId,
        platformKeypair
      )

      if (payoutResult.success && payoutResult.txHashes) {
        await prisma.match.update({
          where: { id: matchId },
          data: {
            payoutTxHash: payoutResult.txHashes.join(',')
          }
        })

        const splitAmount = (totalPot * 0.95) / 2
        await prisma.user.update({
          where: { id: match.creatorId },
          data: { balance: { increment: splitAmount } }
        })
        await prisma.user.update({
          where: { id: match.joinerId! },
          data: { balance: { increment: splitAmount } }
        })
        
        console.log(`   ✅ Draw payout complete: ${splitAmount} SOL each`)
      }
    } else {
      // CRITICAL FIX: Use stored color data to determine winner
      let winnerWallet: string
      let winnerId: string
      let winnerName: string
      
      if (!match.creatorColor || !match.joinerColor) {
        console.error('❌ Color data missing! Cannot determine winner.')
        return NextResponse.json(
          { error: 'Color data missing - cannot determine winner' },
          { status: 500 }
        )
      }

      // Match winner against stored colors
      if (match.winner === 'WHITE') {
        if (match.creatorColor === 'white') {
          winnerWallet = match.creator.wallet
          winnerId = match.creatorId
          winnerName = match.creator.username
          console.log(`   ✅ Winner: Creator (WHITE) - ${winnerName}`)
        } else if (match.joinerColor === 'white') {
          winnerWallet = match.joiner.wallet
          winnerId = match.joinerId!
          winnerName = match.joiner.username
          console.log(`   ✅ Winner: Joiner (WHITE) - ${winnerName}`)
        } else {
          console.error('❌ WHITE winner but no white player found!')
          return NextResponse.json(
            { error: 'Invalid color mapping for winner' },
            { status: 500 }
          )
        }
      } else if (match.winner === 'BLACK') {
        if (match.creatorColor === 'black') {
          winnerWallet = match.creator.wallet
          winnerId = match.creatorId
          winnerName = match.creator.username
          console.log(`   ✅ Winner: Creator (BLACK) - ${winnerName}`)
        } else if (match.joinerColor === 'black') {
          winnerWallet = match.joiner.wallet
          winnerId = match.joinerId!
          winnerName = match.joiner.username
          console.log(`   ✅ Winner: Joiner (BLACK) - ${winnerName}`)
        } else {
          console.error('❌ BLACK winner but no black player found!')
          return NextResponse.json(
            { error: 'Invalid color mapping for winner' },
            { status: 500 }
          )
        }
      } else {
        // Handle CREATOR/JOINER winner types (for non-chess games)
        if (match.winner === 'CREATOR') {
          winnerWallet = match.creator.wallet
          winnerId = match.creatorId
          winnerName = match.creator.username
          console.log(`   ✅ Winner: Creator - ${winnerName}`)
        } else if (match.winner === 'JOINER') {
          winnerWallet = match.joiner.wallet
          winnerId = match.joinerId!
          winnerName = match.joiner.username
          console.log(`   ✅ Winner: Joiner - ${winnerName}`)
        } else {
          console.error(`❌ Unknown winner type: ${match.winner}`)
          return NextResponse.json(
            { error: `Invalid winner type: ${match.winner}` },
            { status: 500 }
          )
        }
      }

      console.log(`   💸 Sending ${totalPot * 0.95} SOL to ${winnerWallet}`)

      payoutResult = await processWinnerPayout(
        winnerWallet,
        totalPot,
        matchId,
        platformKeypair
      )

      if (payoutResult.success && payoutResult.txHash) {
        await prisma.match.update({
          where: { id: matchId },
          data: {
            payoutTxHash: payoutResult.txHash
          }
        })

        const winnerAmount = totalPot * 0.95
        await prisma.user.update({
          where: { id: winnerId },
          data: { balance: { increment: winnerAmount } }
        })
        
        console.log(`   ✅ Winner payout complete: ${winnerAmount} SOL to ${winnerName}`)
      }
    }

    if (!payoutResult.success) {
      return NextResponse.json(
        { error: payoutResult.error || 'Payout failed' },
        { status: 500 }
      )
    }

    const txHashResult = payoutResult.txHash || (payoutResult.txHashes ? payoutResult.txHashes.join(',') : undefined)

    return NextResponse.json({
      success: true,
      message: 'Payout processed successfully',
      txHash: txHashResult,
      winner: match.winner,
      totalPot: totalPot,
      winnerAmount: totalPot * 0.95,
      platformFee: totalPot * 0.05
    })

  } catch (error: any) {
    console.error('Error processing payout:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process payout' },
      { status: 500 }
    )
  }
}

// ==================== CANCEL MATCH & REFUND ====================
export async function DELETE(request: NextRequest) {
  try {
    const { matchId } = await request.json()

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        creator: true,
        joiner: true
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    if (match.status !== 'WAITING' && match.status !== 'PLAYING') {
      return NextResponse.json(
        { error: 'Cannot cancel finished match' },
        { status: 400 }
      )
    }

    const platformKeypair = getPlatformKeypair()
    const refunds = []

    // Refund creator if they deposited
    if (match.createTxHash && match.creator.wallet) {
      const creatorRefund = await processRefund(
        match.creator.wallet,
        match.wager,
        matchId,
        platformKeypair
      )
      if (creatorRefund.success) {
        refunds.push({ player: 'creator', txHash: creatorRefund.txHash })
      }
    }

    // Refund joiner if they deposited
    if (match.joinTxHash && match.joiner?.wallet) {
      const joinerRefund = await processRefund(
        match.joiner.wallet,
        match.wager,
        matchId,
        platformKeypair
      )
      if (joinerRefund.success) {
        refunds.push({ player: 'joiner', txHash: joinerRefund.txHash })
      }
    }

    // Update match status
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'CANCELLED',
        payoutTxHash: refunds.map(r => r.txHash).join(',')
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Match cancelled and refunds processed',
      refunds
    })

  } catch (error: any) {
    console.error('Error cancelling match:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel match' },
      { status: 500 }
    )
  }
}