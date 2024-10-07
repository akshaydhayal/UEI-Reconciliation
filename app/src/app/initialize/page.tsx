// pages/initialize.tsx
"use client";
import { useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

const programID = new PublicKey("9mWe7CADyTP9PCKqqj6j8s25ryiFPYxD2FJerEibyWxe");

const initialize = async (connection: anchor.web3.Connection, wallet: any, storageFee: number) => {
  const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
  const idl = await anchor.Program.fetchIdl(programID, provider);
  const program = new anchor.Program(idl, programID, provider);

  // Derive the PDA for the battery bank
  const [batteryBankPDA, _] = await PublicKey.findProgramAddress(
    [Buffer.from("battery_bank")],
    program.programId
  );

  await program.rpc.initialize(new anchor.BN(storageFee), {
    accounts: {
      batteryBank: batteryBankPDA,
      owner: wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    },
  });

  return batteryBankPDA;
};

const InitializePage = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [storageFee, setStorageFee] = useState<number>(0);
  const [txStatus, setTxStatus] = useState<string>("");

  const handleInitialize = async () => {
    if (!wallet) {
      alert("Please connect your wallet!");
      return;
    }

    try {
      setTxStatus("Initializing...");
      const pda = await initialize(connection, wallet, storageFee);
      setTxStatus(`Initialized Battery Bank at ${pda.toBase58()}`);
    } catch (error) {
      console.error(error);
      setTxStatus("Initialization failed.");
    }
  };

  return (
    <div className="flex flex-col items-center p-8">
      <h2 className="text-2xl font-semibold mb-4">Initialize Battery Bank</h2>
      <input
        type="number"
        placeholder="Storage Fee (in lamports)"
        value={storageFee}
        onChange={(e) => setStorageFee(parseInt(e.target.value))}
        className="border p-2 rounded w-64 mb-4"
      />
      <button
        onClick={handleInitialize}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Initialize
      </button>
      {txStatus && <p className="mt-4">{txStatus}</p>}
    </div>
  );
};

export default InitializePage;
