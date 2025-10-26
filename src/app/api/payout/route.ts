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
  
  // Private key should be stored as base64 or array of numbers
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

    let payoutResult

    if (match.winner === 'DRAW') {
      payoutResult = await processDrawPayout(
        match.creator.wallet,
        match.joiner.wallet,
        match.wager,
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

        const splitAmount = (match.wager * 0.95) / 2
        await prisma.user.update({
          where: { id: match.creatorId },
          data: { balance: { increment: splitAmount } }
        })
        await prisma.user.update({
          where: { id: match.joinerId! },
          data: { balance: { increment: splitAmount } }
        })
      }
    } else {

      const winnerWallet = match.winner === 'CREATOR' 
        ? match.creator.wallet 
        : match.joiner!.wallet

      const winnerId = match.winner === 'CREATOR'
        ? match.creatorId
        : match.joinerId!

      // Process winner payout
      payoutResult = await processWinnerPayout(
        winnerWallet,
        match.wager,
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

        // Update winner balance
        const winnerAmount = match.wager * 0.95
        await prisma.user.update({
          where: { id: winnerId },
          data: { balance: { increment: winnerAmount } }
        })
      }
    }

    if (!payoutResult.success) {
      return NextResponse.json(
        { error: payoutResult.error || 'Payout failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payout processed successfully',
      txHash: payoutResult.txHash || payoutResult.txHashes,
      winner: match.winner,
      amount: match.wager * 0.95
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
