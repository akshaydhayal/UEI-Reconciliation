// File: components/EnergyStorageUI.tsx
'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3, Idl } from '@project-serum/anchor';
import { BN } from 'bn.js';

// Import the IDL
import idl from '../idl/energy_storage.json';

const programID = new PublicKey('9mWe7CADyTP9PCKqqj6j8s25ryiFPYxD2FJerEibyWxe');

export default function EnergyStorageUI() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [batteryBank, setBatteryBank] = useState<PublicKey | null>(null);
  const [producerAccount, setProducerAccount] = useState<PublicKey | null>(null);
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const initializeProgram = async () => {
      if (!publicKey) {
        setMessage('Please connect your wallet.');
        return;
      }

      try {
        console.log('Initializing program...');
        console.log('PublicKey:', publicKey.toBase58());
        console.log('Connection:', connection);

        const provider = new AnchorProvider(
          connection,
          {
            publicKey,
            signTransaction,
            signAllTransactions,
          },
          { commitment: 'confirmed' }
        );

        console.log('Provider created:', provider);

        // Check if idl is properly loaded
        if (!idl || !idl.instructions || !idl.accounts) {
          throw new Error('IDL is not properly loaded');
        }

        console.log('IDL loaded successfully');
        console.log('Program ID:', programID.toBase58());

        const program = new Program(idl as Idl, programID, provider);
        console.log('Program created:', program);

        if (!program) {
          throw new Error('Failed to create program instance');
        }

        setProgram(program);
        setMessage('Program initialized successfully.');
      } catch (error) {
        console.error('Error initializing program:', error);
        setMessage(`Error initializing program: ${error.message}`);
      }
    };

    initializeProgram();
  }, [publicKey, connection, signTransaction, signAllTransactions]);

  console.log("public Key : ",publicKey);
  console.log("program : ",program);
  // console.log("idl : ",idl);
  // console.log("programId : ",programID.toBase58());

  const initializeBatteryBank = async () => {
    if (!program || !publicKey) {
      setMessage('Program not initialized or wallet not connected.');
      return;
    }
    try {
      const [batteryBankPda] = await PublicKey.findProgramAddress(
        [Buffer.from('battery_bank')],
        program.programId
      );
      await program.methods.initialize(new BN(1))
        .accounts({
          batteryBank: batteryBankPda,
          owner: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      setBatteryBank(batteryBankPda);
      setMessage('Battery bank initialized successfully.');
    } catch (error) {
      console.error('Error initializing battery bank:', error);
      setMessage(`Error initializing battery bank: ${error.message}`);
    }
  };

  const storeEnergy = async () => {
    if (!program || !batteryBank || !publicKey) {
      setMessage('Program not initialized, battery bank not set, or wallet not connected.');
      return;
    }
    try {
      const [producerAccountPda] = await PublicKey.findProgramAddress(
        [Buffer.from('producer'), batteryBank.toBuffer(), publicKey.toBuffer()],
        program.programId
      );
      await program.methods.storeEnergy(new BN(amount), new BN(rate))
        .accounts({
          batteryBank: batteryBank,
          producerAccount: producerAccountPda,
          producer: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      setProducerAccount(producerAccountPda);
      setMessage('Energy stored successfully.');
    } catch (error) {
      console.error('Error storing energy:', error);
      setMessage(`Error storing energy: ${error.message}`);
    }
  };

  const consumeEnergy = async () => {
    if (!program || !batteryBank || !producerAccount || !publicKey) {
      setMessage('Program not initialized, battery bank not set, producer account not set, or wallet not connected.');
      return;
    }
    try {
      await program.methods.consumeEnergy(new BN(amount))
        .accounts({
          batteryBank: batteryBank,
          producerAccount: producerAccount,
          owner: publicKey,
        })
        .rpc();
      setMessage('Energy consumed successfully.');
    } catch (error) {
      console.error('Error consuming energy:', error);
      setMessage(`Error consuming energy: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <p>{message}</p>
      <p>Wallet connected: {publicKey ? 'Yes' : 'No'}</p>
      <p>Program initialized: {program ? 'Yes' : 'No'}</p>
      {publicKey && (
        <>
          <button onClick={initializeBatteryBank} className="bg-blue-500 text-white px-4 py-2 rounded">
            Initialize Battery Bank
          </button>
          <div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="border p-2 mr-2"
            />
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="Rate"
              className="border p-2 mr-2"
            />
            <button onClick={storeEnergy} className="bg-green-500 text-white px-4 py-2 rounded">
              Store Energy
            </button>
          </div>
          <div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="border p-2 mr-2"
            />
            <button onClick={consumeEnergy} className="bg-red-500 text-white px-4 py-2 rounded">
              Consume Energy
            </button>
          </div>
        </>
      )}
    </div>
  );
}






// // File: components/EnergyStorageUI.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { useWallet } from '@solana/wallet-adapter-react';
// import { Connection, PublicKey, Transaction } from '@solana/web3.js';
// // import { Program, AnchorProvider, web3, Idl } from '@project-serum/anchor';
// import { Program, AnchorProvider, web3, Idl } from '@coral-xyz/anchor';
// import { BN } from 'bn.js';

// // Import the IDL as a regular JavaScript object
// import idl from '../../../target/idl/energy_storage.json';

// // const programID = new PublicKey('YOUR_PROGRAM_ID_HERE');
// const programID = new PublicKey('9mWe7CADyTP9PCKqqj6j8s25ryiFPYxD2FJerEibyWxe');

// export default function EnergyStorageUI() {
//   const wallet = useWallet();
//   const [program, setProgram] = useState<Program | null>(null);
//   const [batteryBank, setBatteryBank] = useState<PublicKey | null>(null);
//   const [producerAccount, setProducerAccount] = useState<PublicKey | null>(null);
//   const [amount, setAmount] = useState('');
//   const [rate, setRate] = useState('');

//   useEffect(() => {
//     const initializeProgram = async () => {
//       if (wallet && wallet.publicKey) {
//         const connection = new Connection('https://api.devnet.solana.com');
//         const provider = new AnchorProvider(
//           connection,
//           wallet as any,
//           AnchorProvider.defaultOptions()
//         );
//         // Assert the IDL to be of type Idl
//         const program = new Program(idl as Idl, programID, provider);
//         setProgram(program);
//       }
//     };

//     initializeProgram();
//   }, [wallet]);

//   const initializeBatteryBank = async () => {
//     if (!program || !wallet.publicKey) return;
//     try {
//       const [batteryBankPda] = await PublicKey.findProgramAddress(
//         [Buffer.from('battery_bank')],
//         program.programId
//       );
//       await program.methods.initialize(new BN(1)) // Set storage fee to 1
//         .accounts({
//           batteryBank: batteryBankPda,
//           owner: wallet.publicKey,
//           systemProgram: web3.SystemProgram.programId,
//         })
//         .rpc();
//       console.log('Battery bank initialized');
//       setBatteryBank(batteryBankPda);
//     } catch (error) {
//       console.error('Error initializing battery bank:', error);
//     }
//   };

//   const storeEnergy = async () => {
//     if (!program || !batteryBank || !wallet.publicKey) return;
//     try {
//       const [producerAccountPda] = await PublicKey.findProgramAddress(
//         [Buffer.from('producer'), batteryBank.toBuffer(), wallet.publicKey.toBuffer()],
//         program.programId
//       );
//       await program.methods.storeEnergy(new BN(amount), new BN(rate))
//         .accounts({
//           batteryBank: batteryBank,
//           producerAccount: producerAccountPda,
//           producer: wallet.publicKey,
//           systemProgram: web3.SystemProgram.programId,
//         })
//         .rpc();
//       console.log('Energy stored');
//       setProducerAccount(producerAccountPda);
//     } catch (error) {
//       console.error('Error storing energy:', error);
//     }
//   };

//   const consumeEnergy = async () => {
//     if (!program || !batteryBank || !producerAccount || !wallet.publicKey) return;
//     try {
//       await program.methods.consumeEnergy(new BN(amount))
//         .accounts({
//           batteryBank: batteryBank,
//           producerAccount: producerAccount,
//           owner: wallet.publicKey,
//         })
//         .rpc();
//       console.log('Energy consumed');
//     } catch (error) {
//       console.error('Error consuming energy:', error);
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <button onClick={initializeBatteryBank} className="bg-blue-500 text-white px-4 py-2 rounded">
//         Initialize Battery Bank
//       </button>
//       <div>
//         <input
//           type="number"
//           value={amount}
//           onChange={(e) => setAmount(e.target.value)}
//           placeholder="Amount"
//           className="border p-2 mr-2"
//         />
//         <input
//           type="number"
//           value={rate}
//           onChange={(e) => setRate(e.target.value)}
//           placeholder="Rate"
//           className="border p-2 mr-2"
//         />
//         <button onClick={storeEnergy} className="bg-green-500 text-white px-4 py-2 rounded">
//           Store Energy
//         </button>
//       </div>
//       <div>
//         <input
//           type="number"
//           value={amount}
//           onChange={(e) => setAmount(e.target.value)}
//           placeholder="Amount"
//           className="border p-2 mr-2"
//         />
//         <button onClick={consumeEnergy} className="bg-red-500 text-white px-4 py-2 rounded">
//           Consume Energy
//         </button>
//       </div>
//     </div>
//   );
// }






// 'use client';

// import { useState, useEffect } from 'react';
// import { useWallet } from '@solana/wallet-adapter-react';
// import { Connection, PublicKey, Transaction, clusterApiUrl } from '@solana/web3.js';
// // import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
// import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
// // import idl from '../idl/energy_storage.json';
// import idl from '../../../target/idl/energy_storage.json';

// const programID = new PublicKey('9mWe7CADyTP9PCKqqj6j8s25ryiFPYxD2FJerEibyWxe');

// export default function EnergyStorageUI() {
//   const wallet = useWallet();
//   const [program, setProgram] = useState(null);
//   const [batteryBank, setBatteryBank] = useState(null);
//   const [producerAccount, setProducerAccount] = useState(null);
//   const [amount, setAmount] = useState('');
//   const [rate, setRate] = useState('');

//   // useEffect(() => {
//   //   const connection = new Connection('https://api.devnet.solana.com');
//   //   const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
//   //   const program = new Program(idl, programID, provider);
//   //   setProgram(program);
//   // }, [wallet]);

//   useEffect(() => {
//   const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
//   if(!wallet){
//     return;
//   }
//   // const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
//     const provider = new AnchorProvider(connection, wallet, {
//         preflightCommitment: "processed",
//       });
//     const program = new Program(idl, programID, provider);
//     setProgram(program);
// }, [wallet]);


//   const initializeBatteryBank = async () => {
//     if (!program) return;
//     try {
//       const [batteryBankPda] = await PublicKey.findProgramAddress(
//         [Buffer.from('battery_bank')],
//         program.programId
//       );
//       await program.methods.initialize(new BN(1)) // Set storage fee to 1
//         .accounts({
//           batteryBank: batteryBankPda,
//           owner: wallet.publicKey,
//           systemProgram: web3.SystemProgram.programId,
//         })
//         .rpc();
//       console.log('Battery bank initialized');
//       setBatteryBank(batteryBankPda);
//     } catch (error) {
//       console.error('Error initializing battery bank:', error);
//     }
//   };

//   const storeEnergy = async () => {
//     if (!program || !batteryBank) return;
//     try {
//       const [producerAccountPda] = await PublicKey.findProgramAddress(
//         [Buffer.from('producer'), batteryBank.toBuffer(), wallet.publicKey.toBuffer()],
//         program.programId
//       );
//       await program.methods.storeEnergy(new BN(amount), new BN(rate))
//         .accounts({
//           batteryBank: batteryBank,
//           producerAccount: producerAccountPda,
//           producer: wallet.publicKey,
//           systemProgram: web3.SystemProgram.programId,
//         })
//         .rpc();
//       console.log('Energy stored');
//       setProducerAccount(producerAccountPda);
//     } catch (error) {
//       console.error('Error storing energy:', error);
//     }
//   };

//   const consumeEnergy = async () => {
//     if (!program || !batteryBank || !producerAccount) return;
//     try {
//       await program.methods.consumeEnergy(new BN(amount))
//         .accounts({
//           batteryBank: batteryBank,
//           producerAccount: producerAccount,
//           owner: wallet.publicKey,
//         })
//         .rpc();
//       console.log('Energy consumed');
//     } catch (error) {
//       console.error('Error consuming energy:', error);
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <button onClick={initializeBatteryBank} className="bg-blue-500 text-white px-4 py-2 rounded">
//         Initialize Battery Bank
//       </button>
//       <div>
//         <input
//           type="number"
//           value={amount}
//           onChange={(e) => setAmount(e.target.value)}
//           placeholder="Amount"
//           className="border p-2 mr-2"
//         />
//         <input
//           type="number"
//           value={rate}
//           onChange={(e) => setRate(e.target.value)}
//           placeholder="Rate"
//           className="border p-2 mr-2"
//         />
//         <button onClick={storeEnergy} className="bg-green-500 text-white px-4 py-2 rounded">
//           Store Energy
//         </button>
//       </div>
//       <div>
//         <input
//           type="number"
//           value={amount}
//           onChange={(e) => setAmount(e.target.value)}
//           placeholder="Amount"
//           className="border p-2 mr-2"
//         />
//         <button onClick={consumeEnergy} className="bg-red-500 text-white px-4 py-2 rounded">
//           Consume Energy
//         </button>
//       </div>
//     </div>
//   );
// }