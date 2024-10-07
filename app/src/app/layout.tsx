// app/layout.js
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProviderWrapper } from '../components/WalletProviderWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Energy Storage Smart Contract',
  description: 'UI for interacting with the Energy Storage Smart Contract on Solana',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProviderWrapper>
          {children}
        </WalletProviderWrapper>
      </body>
    </html>
  )
}