// "use client";
// import Header from "@/components/Header";
// // app/layout.tsx
// import WalletConnectProvider from "../components/WalletProvider";
// import "./globals.css";
// import { useState } from "react";

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <body>
//         <WalletConnectProvider>
//                 <Header />
//             <main className="p-4">{children}</main>
//         </WalletConnectProvider>
//       </body>
//     </html>
//   );
// }






// // File: app/layout.tsx
'use client';

import React, { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {ConnectionProvider,WalletProvider} from '@solana/wallet-adapter-react';
import {WalletModalProvider, WalletMultiButton} from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import type { ReactNode } from 'react';

// Import global styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            // You can add more wallet adapters here
            // e.g., new SolflareWalletAdapter(), new SlopeWalletAdapter(), etc.
        ],
        []
    );

    return (
          <html lang="en">
            <body>
              {/* {children} */}
              <ConnectionProvider endpoint={endpoint}>
                  <WalletProvider wallets={wallets} autoConnect>
                      <WalletModalProvider>
                          {children}
                      </WalletModalProvider>
                  </WalletProvider>
              </ConnectionProvider>
            </body>
    </html>
    );
};

export default Layout;