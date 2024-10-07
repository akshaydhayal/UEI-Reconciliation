"use client";
import React from 'react'
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

const WalletConnectProvider = ({children}:{children:React.ReactNode}) => {
  const endpoint=clusterApiUrl("devnet");
  return (
        <ConnectionProvider endpoint={endpoint}>
            {/* <WalletProvider wallets={[]} autoConnect> */}
            <WalletProvider wallets={[]} >
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
  )
}

export default WalletConnectProvider