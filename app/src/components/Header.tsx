// components/Header.tsx
import { FC } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import '@solana/wallet-adapter-react-ui/styles.css';

const Header: FC = () => {
  return (
    <header className="flex justify-between items-center p-4 bg-blue-600 text-white">
      <h1 className="text-xl font-bold">Solana Energy UI</h1>
      <WalletMultiButton />
    </header>
  );
};

export default Header;
