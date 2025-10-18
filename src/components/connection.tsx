"use client"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletConnectButton, WalletDisconnectButton, WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"
import React, { useMemo } from "react"
import '@solana/wallet-adapter-react-ui/styles.css';


const WalletConnectionProvider = ({children}:{children: React.ReactNode}) => {

    const network = WalletAdapterNetwork.Devnet

    const endpoint = useMemo(() => clusterApiUrl(network),[network])

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={[]} autoConnect>
                {children}
            </WalletProvider>
        </ConnectionProvider>
    )
}

export default WalletConnectionProvider