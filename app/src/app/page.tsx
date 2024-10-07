// app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, utils, BN } from '@project-serum/anchor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import idl from '../idl/idl.json';

// const programID = new web3.PublicKey("9mWe7CADyTP9PCKqqj6j8s25ryiFPYxD2FJerEibyWxe");
const programID = new web3.PublicKey("BYBAEWJyCJnLQBmfArxPc4jJnKDy3GBDhCi1Z2GUh3b7");

// Convert the imported IDL to the format Anchor expects
const idlObject = JSON.parse(JSON.stringify(idl));

export default function Home() {
  const { connection } = useConnection();
  // const { publicKey, wallet } = useWallet();
  const { publicKey } = useWallet();
  const anchorWallet=useAnchorWallet();
  const [program, setProgram] = useState(null);
  const [batteryBank, setBatteryBank] = useState(null);
  const [producerAccount, setProducerAccount] = useState(null);

  const [storageFee, setStorageFee] = useState('');
  const [storeAmount, setStoreAmount] = useState('');
  const [storeRate, setStoreRate] = useState('');
  const [consumeAmount, setConsumeAmount] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const initializeProgram = async () => {
      // if (wallet && connection && idlObject) {
      if (anchorWallet && connection && idlObject) {
        try {
          // const provider = new AnchorProvider(connection, wallet, {});
          const provider = new AnchorProvider(connection, anchorWallet, {});
          const program = new Program(idlObject, programID, provider);
          setProgram(program);

          // Battery bank is now a normal account, not a PDA
          const batteryBankKeypair = web3.Keypair.generate();
          setBatteryBank(batteryBankKeypair);

          if (publicKey) {
            const producerAccountPDA = web3.PublicKey.findProgramAddressSync(
              [Buffer.from("producer"), batteryBankKeypair.publicKey.toBuffer(), publicKey.toBuffer()],
              program.programId
            )[0];
            setProducerAccount(producerAccountPDA);
          }
        } catch (error) {
          console.error("Error initializing program:", error);
          setMessage(`Error initializing program: ${error.message}`);
        }
      }
    };

    initializeProgram();
  // }, [wallet, connection, publicKey]);
  }, [anchorWallet, connection, publicKey]);

  const handleInitialize = async () => {
    if (!program || !publicKey || !batteryBank) return;
    try {
      const tx = await program.methods.initialize(new BN(storageFee))
        .accounts({
          batteryBank: batteryBank.publicKey,
          owner: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([batteryBank])
        .rpc();
      setMessage(`Battery Bank initialized. Transaction: ${tx}`);
    } catch (error) {
      console.error('Error:', error);
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleStoreEnergy = async () => {
    if (!program || !publicKey || !batteryBank || !producerAccount) return;
    try {
      const tx = await program.methods.storeEnergy(new BN(storeAmount), new BN(storeRate))
        .accounts({
          batteryBank: batteryBank.publicKey,
          producerAccount: producerAccount,
          producer: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      setMessage(`Energy stored. Transaction: ${tx}`);
    } catch (error) {
      console.error('Error:', error);
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleConsumeEnergy = async () => {
    if (!program || !publicKey || !batteryBank || !producerAccount) return;
    try {
      const tx = await program.methods.consumeEnergy(new BN(consumeAmount))
        .accounts({
          batteryBank: batteryBank.publicKey,
          producerAccount: producerAccount,
          owner: publicKey,
        })
        .rpc();
      setMessage(`Energy consumed. Transaction: ${tx}`);
    } catch (error) {
      console.error('Error:', error);
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Energy Storage Smart Contract</h1>
      
      <div className="mb-4">
        <WalletMultiButton className="!bg-blue-500 hover:!bg-blue-700 !text-white font-bold py-2 px-4 rounded" />
      </div>

      {publicKey ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Initialize Battery Bank</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                placeholder="Storage Fee"
                value={storageFee}
                onChange={(e) => setStorageFee(e.target.value)}
                className="mb-2"
              />
              <Button onClick={handleInitialize}>Initialize</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store Energy</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                placeholder="Amount"
                value={storeAmount}
                onChange={(e) => setStoreAmount(e.target.value)}
                className="mb-2"
              />
              <Input
                type="number"
                placeholder="Rate"
                value={storeRate}
                onChange={(e) => setStoreRate(e.target.value)}
                className="mb-2"
              />
              <Button onClick={handleStoreEnergy}>Store Energy</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consume Energy</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                placeholder="Amount"
                value={consumeAmount}
                onChange={(e) => setConsumeAmount(e.target.value)}
                className="mb-2"
              />
              <Button onClick={handleConsumeEnergy}>Consume Energy</Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-center mt-8">Please connect your wallet to use this app.</p>
      )}

      {message && (
        <Card className="mt-4">
          <CardContent>
            <p className="text-center">{message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}