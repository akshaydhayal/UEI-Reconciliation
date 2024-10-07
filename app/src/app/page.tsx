"use client";
import React, { useState, useEffect } from 'react';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Battery, BatteryCharging, BatteryFull, Zap, DollarSign, BarChart2 } from 'lucide-react';
import idl from '../idl/idl.json';

const programID = new web3.PublicKey("BYBAEWJyCJnLQBmfArxPc4jJnKDy3GBDhCi1Z2GUh3b7");
const idlObject = JSON.parse(JSON.stringify(idl));

const Loader = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
  </div>
);

export default function Home() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const anchorWallet=useAnchorWallet();
  const [program, setProgram] = useState(null);
  const [batteryBank, setBatteryBank] = useState(null);
  const [producerAccount, setProducerAccount] = useState(null);
  const [batteryBankData, setBatteryBankData] = useState(null);
  const [producerData, setProducerData] = useState(null);
  const [storageFee, setStorageFee] = useState('');
  const [storeAmount, setStoreAmount] = useState('');
  const [storeRate, setStoreRate] = useState('');
  const [consumeAmount, setConsumeAmount] = useState('');
  const [message, setMessage] = useState('');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);

  useEffect(() => {
    const initializeProgram = async () => {
      if (anchorWallet && connection && idlObject) {
        try {
          const provider = new AnchorProvider(connection, anchorWallet, {});
          const program = new Program(idlObject, programID, provider);
          setProgram(program);

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
  }, [anchorWallet, connection, publicKey]);

  useEffect(() => {
    const fetchAccountData = async () => {
      if (program && batteryBank && producerAccount) {
        try {
          const batteryBankAccount = await program.account.batteryBank.fetch(batteryBank.publicKey);
          setBatteryBankData(batteryBankAccount);

          const producerAccountData = await program.account.producerAccount.fetch(producerAccount);
          setProducerData(producerAccountData);
        } catch (error) {
          console.error("Error fetching account data:", error);
        }
      }
    };

    fetchAccountData();
    const intervalId = setInterval(fetchAccountData, 10000); // Refresh every 10 seconds

    return () => clearInterval(intervalId);
  }, [program, batteryBank, producerAccount]);

  const handleInitialize = async () => {
    if (!program || !publicKey || !batteryBank) return;
    setIsInitializing(true);

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
    }finally{
      setIsInitializing(false);
    }
  };

  const handleStoreEnergy = async () => {
    if (!program || !publicKey || !batteryBank || !producerAccount) return;
    setIsStoring(true);
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
    }finally{
      setIsStoring(false);
    }
  };

  const handleConsumeEnergy = async () => {
    if (!program || !publicKey || !batteryBank || !producerAccount) return;
    setIsConsuming(true);
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
      }finally{
        setIsConsuming(false);
      }
  };

  
    const AccountDataDisplay = ({ title, data,icon }) => {
    const formatData = (data) => {
      if (!data) return null;
      
      return {
        ...data,
        producer: data?.producer?.toString(),
        storedAmount: new BN(data.storedAmount).toString(),
        consumedAmount: new BN(data.consumedAmount).toString(),
        rate: new BN(data.rate).toString(),
        balance: new BN(data.balance).toString(),
        lastReconciled: new Date(data.lastReconciled * 1000).toLocaleString(),
        transactions: data?.transactions?.map(tx => ({
          ...tx,
          txType: Object.keys(tx.txType)[0],
          amount: new BN(tx.amount).toString(),
          timestamp: new Date(tx.timestamp * 1000).toLocaleString()
        }))
      };
    };

    const formattedData = formatData(data);

    return (
      <Card className="mt-4 bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-400">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap text-gray-300">{JSON.stringify(formattedData, null, 2)}</pre>
      </CardContent>
    </Card>
    );
  };

    const EnergyChart = ({ producerData }) => {
    const data = [
      { name: 'Stored', energy: producerData ? new BN(producerData.storedAmount).toNumber() : 0 },
      { name: 'Consumed', energy: producerData ? new BN(producerData.consumedAmount).toNumber() : 0 },
    ];

    return (
      <Card className="mt-4 bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-blue-400"><BarChart2 className="mr-2" /> Energy Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis dataKey="name" stroke="#a0aec0" />
            <YAxis stroke="#a0aec0" />
            <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none', borderRadius: '4px' }} />
            <Legend />
            <Bar dataKey="energy" fill="#4299e1" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
    );
  };


  // const TransactionList = ({ transactions, storageFee }) => {
  const TransactionList = ({ data }) => {
    const formatData = (data) => {
      if (!data) return null;
      
      return {
        ...data,
        producer: data?.producer?.toString(),
        storedAmount: new BN(data.storedAmount).toString(),
        consumedAmount: new BN(data.consumedAmount).toString(),
        rate: new BN(data.rate).toString(),
        balance: new BN(data.balance).toString(),
        lastReconciled: new Date(data.lastReconciled * 1000).toLocaleString(),
        transactions: data?.transactions?.map(tx => ({
          ...tx,
          txType: Object.keys(tx.txType)[0],
          amount: new BN(tx.amount).toString(),
          timestamp: new Date(tx.timestamp * 1000).toLocaleString()
        }))
      };
    };

    const formattedData = formatData(data);
    console.log("formatted data : ",formattedData);
    const [totalOwed, setTotalOwed] = useState({ toBob: 0, toProducers: 0 });
  
    useEffect(() => {
      let toBob = 0;
      let toProducers = 0;
  
      formattedData.transactions.forEach(tx => {
        const amount = new BN(tx.amount).toNumber();
        if (tx.txType === 'store') {
          toBob += amount * batteryBankData?.storageFee?.toNumber();
        } else if (tx.txType === 'consume') {
          toProducers += amount * new BN(formattedData.rate).toNumber();
        }
      });
  
      setTotalOwed({ toBob, toProducers });
    }, []);
    // }, [transactions, storageFee]);
  
    return (
      <Card className="mt-4 bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center text-green-400"><DollarSign className="mr-2" /> Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-300">Type</TableHead>
              <TableHead className="text-gray-300">Amount (kWh)</TableHead>
              <TableHead className="text-gray-300">Rate ($/kWh)</TableHead>
              <TableHead className="text-gray-300">Total ($)</TableHead>
              <TableHead className="text-gray-300">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
  
          <TableBody>
            {formattedData.transactions.map((tx, index) => {
              const txType = tx.txType === 'store' ? 'Stored Energy' : 'Consumed Energy';
              const rate = tx.txType === 'store' ? new BN(batteryBankData?.storageFee?.toNumber()): new BN(formattedData.rate);
              // const rate = tx.txType === 'store' ? new BN(batteryBankData?.storageFee?.toNumber()): new BN(tx.rate);
              const total = new BN(tx.amount).mul(rate);

              console.log(txType,rate.toString(), total.toString());
              console.log(rate, total);
              // ... (logic remains the same)

              return (
                <TableRow key={index}>
                  <TableCell className="text-gray-300">{txType}</TableCell>
                  <TableCell className="text-gray-300">{new BN(tx.amount).toString()}</TableCell>
                  <TableCell className="text-gray-300">${rate.toString()}</TableCell>
                  <TableCell className="text-gray-300">${total.toString()}</TableCell>
                  <TableCell className="text-gray-300">{tx.timestamp}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="mt-4 text-gray-300">
          <h3 className="text-lg font-semibold text-blue-400">Summary</h3>
          <p>Producers owe Bob (for storage): {totalOwed.toBob.toFixed(0)} $</p>
          <p>Bob owes Producers (for consumed energy): {totalOwed.toProducers.toFixed(0)} $</p>
          <p>
            Net Balance: {Math.abs(totalOwed.toProducers - totalOwed.toBob).toFixed(0)} $ 
            {totalOwed.toProducers > totalOwed.toBob 
              ? ' owed to Producers' 
              : ' owed to Bob'}
          </p>
        </div>
      </CardContent>
    </Card>
    );
  };


  return (
    <div className="container mx-auto p-4 bg-gray-900 text-white min-h-screen">
      <div className='flex justify-between items-center px-8'>

      <h1 className="text-3xl font-bold mb-6 flex items-center text-blue-400">
        <Battery className="mr-2" /> UEI Energy Ledger
      </h1>
      <div className="mb-4">
        <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !text-white font-bold py-2 px-4 rounded" />
      </div>
      </div>

      {publicKey ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-400">
                  <BatteryFull className="mr-2" /> Initialize Battery Bank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="number"
                  placeholder="Bank Storage Rate($/kWh)"
                  value={storageFee}
                  onChange={(e) => setStorageFee(e.target.value)}
                  className="mb-2 bg-gray-700 text-white border-gray-600"
                />
                <Button onClick={handleInitialize} disabled={isInitializing} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isInitializing ? <Loader /> : 'Initialize'}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-green-400">
                  <BatteryCharging className="mr-2" /> Store Energy (For Surplus Energy Producer)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="number"
                  placeholder="Energy Amount to Store"
                  value={storeAmount}
                  onChange={(e) => setStoreAmount(e.target.value)}
                  className="mb-2 bg-gray-700 text-white border-gray-600"
                />
                <Input
                  type="number"
                  placeholder="Units Charge($/kWh) if used"
                  value={storeRate}
                  onChange={(e) => setStoreRate(e.target.value)}
                  className="mb-2 bg-gray-700 text-white border-gray-600"
                />
                <Button onClick={handleStoreEnergy} disabled={isStoring} className="bg-green-600 hover:bg-green-700 text-white">
                  {isStoring ? <Loader /> : 'Store Energy'}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-400">
                  <Zap className="mr-2" /> Consume Energy (by Battery Bank Owner)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="number"
                  placeholder="Energy Amount to consume"
                  value={consumeAmount}
                  onChange={(e) => setConsumeAmount(e.target.value)}
                  className="mb-2 bg-gray-700 text-white border-gray-600"
                />
                <Button onClick={handleConsumeEnergy} disabled={isConsuming} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  {isConsuming ? <Loader /> : 'Consume Energy'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {message && (
            <Card className="mt-4 bg-gray-800 border-gray-700">
              <CardContent>
                <p className="text-center text-white">{message}</p>
              </CardContent>
            </Card>
          )}
        
          {isLoading ? (
            <Loader />
          ) : (
            <>
              {batteryBankData && producerData && (
                <TransactionList data={producerData} />
              )}
              {batteryBankData && 
                <div className="flex">
                  <AccountDataDisplay title="Battery Bank Data" data={batteryBankData} icon={<BatteryFull className="text-blue-400" />} />
                  <AccountDataDisplay title="Producer Account Data" data={producerData} icon={<Zap className="text-yellow-400" />} />
                </div>
              }
              {producerData && <EnergyChart producerData={producerData} />}
            </>
          )}
        </>
      ) : (
        <p className="text-center mt-8 text-gray-300">Please connect your wallet to use this app.</p>
      )}
    </div>
  );
}
// "use client";
// import React, { useState, useEffect } from 'react';
// import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
// import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import idl from '../idl/idl.json';

// const programID = new web3.PublicKey("BYBAEWJyCJnLQBmfArxPc4jJnKDy3GBDhCi1Z2GUh3b7");
// const idlObject = JSON.parse(JSON.stringify(idl));

// export default function Home() {
//   const { connection } = useConnection();
//   const { publicKey } = useWallet();
//   const anchorWallet=useAnchorWallet();
//   const [program, setProgram] = useState(null);
//   const [batteryBank, setBatteryBank] = useState(null);
//   const [producerAccount, setProducerAccount] = useState(null);
//   const [batteryBankData, setBatteryBankData] = useState(null);
//   const [producerData, setProducerData] = useState(null);
//   const [storageFee, setStorageFee] = useState('');
//   const [storeAmount, setStoreAmount] = useState('');
//   const [storeRate, setStoreRate] = useState('');
//   const [consumeAmount, setConsumeAmount] = useState('');
//   const [message, setMessage] = useState('');
//   const [latestData,setLatestData]=useState(null);

//   useEffect(() => {
//     const initializeProgram = async () => {
//       if (anchorWallet && connection && idlObject) {
//         try {
//           const provider = new AnchorProvider(connection, anchorWallet, {});
//           const program = new Program(idlObject, programID, provider);
//           setProgram(program);

//           const batteryBankKeypair = web3.Keypair.generate();
//           setBatteryBank(batteryBankKeypair);

//           if (publicKey) {
//             const producerAccountPDA = web3.PublicKey.findProgramAddressSync(
//               [Buffer.from("producer"), batteryBankKeypair.publicKey.toBuffer(), publicKey.toBuffer()],
//               program.programId
//             )[0];
//             setProducerAccount(producerAccountPDA);
//           }
//         } catch (error) {
//           console.error("Error initializing program:", error);
//           setMessage(`Error initializing program: ${error.message}`);
//         }
//       }
//     };

//     initializeProgram();
//   }, [anchorWallet, connection, publicKey]);

//   useEffect(() => {
//     const fetchAccountData = async () => {
//       if (program && batteryBank && producerAccount) {
//         try {
//           const batteryBankAccount = await program.account.batteryBank.fetch(batteryBank.publicKey);
//           setBatteryBankData(batteryBankAccount);

//           const producerAccountData = await program.account.producerAccount.fetch(producerAccount);
//           setProducerData(producerAccountData);
//         } catch (error) {
//           console.error("Error fetching account data:", error);
//         }
//       }
//     };

//     fetchAccountData();
//     const intervalId = setInterval(fetchAccountData, 10000); // Refresh every 10 seconds

//     return () => clearInterval(intervalId);
//   }, [program, batteryBank, producerAccount]);

//   const handleInitialize = async () => {
//     if (!program || !publicKey || !batteryBank) return;
//     try {
//       const tx = await program.methods.initialize(new BN(storageFee))
//         .accounts({
//           batteryBank: batteryBank.publicKey,
//           owner: publicKey,
//           systemProgram: web3.SystemProgram.programId,
//         })
//         .signers([batteryBank])
//         .rpc();
//       setMessage(`Battery Bank initialized. Transaction: ${tx}`);
//     } catch (error) {
//       console.error('Error:', error);
//       setMessage(`Error: ${error.message}`);
//     }
//   };

//   const handleStoreEnergy = async () => {
//     if (!program || !publicKey || !batteryBank || !producerAccount) return;
//     try {
//       const tx = await program.methods.storeEnergy(new BN(storeAmount), new BN(storeRate))
//         .accounts({
//           batteryBank: batteryBank.publicKey,
//           producerAccount: producerAccount,
//           producer: publicKey,
//           systemProgram: web3.SystemProgram.programId,
//         })
//         .rpc();
//       setMessage(`Energy stored. Transaction: ${tx}`);
//     } catch (error) {
//       console.error('Error:', error);
//       setMessage(`Error: ${error.message}`);
//     }
//   };

//   const handleConsumeEnergy = async () => {
//     if (!program || !publicKey || !batteryBank || !producerAccount) return;
//     try {
//       const tx = await program.methods.consumeEnergy(new BN(consumeAmount))
//         .accounts({
//           batteryBank: batteryBank.publicKey,
//           producerAccount: producerAccount,
//           owner: publicKey,
//         })
//         .rpc();
//       setMessage(`Energy consumed. Transaction: ${tx}`);
//     } catch (error) {
//       console.error('Error:', error);
//       setMessage(`Error: ${error.message}`);
//     }
//   };

  
//     const AccountDataDisplay = ({ title, data }) => {
//     const formatData = (data) => {
//       if (!data) return null;
      
//       return {
//         ...data,
//         producer: data?.producer?.toString(),
//         storedAmount: new BN(data.storedAmount).toString(),
//         consumedAmount: new BN(data.consumedAmount).toString(),
//         rate: new BN(data.rate).toString(),
//         balance: new BN(data.balance).toString(),
//         lastReconciled: new Date(data.lastReconciled * 1000).toLocaleString(),
//         transactions: data?.transactions?.map(tx => ({
//           ...tx,
//           txType: Object.keys(tx.txType)[0],
//           amount: new BN(tx.amount).toString(),
//           timestamp: new Date(tx.timestamp * 1000).toLocaleString()
//         }))
//       };
//     };

//     const formattedData = formatData(data);

//     return (
//       <Card className="mt-4">
//         <CardHeader>
//           <CardTitle>{title}</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <pre className="whitespace-pre-wrap">{JSON.stringify(formattedData, null, 2)}</pre>
//         </CardContent>
//       </Card>
//     );
//   };

//     const EnergyChart = ({ producerData }) => {
//     const data = [
//       { name: 'Stored', energy: producerData ? new BN(producerData.storedAmount).toNumber() : 0 },
//       { name: 'Consumed', energy: producerData ? new BN(producerData.consumedAmount).toNumber() : 0 },
//     ];

//     return (
//       <Card className="mt-4">
//         <CardHeader>
//           <CardTitle>Energy Overview</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={data}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="energy" fill="#8884d8" />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>
//     );
//   };


//   // const TransactionList = ({ transactions, storageFee }) => {
//   const TransactionList = ({ data }) => {
//     const formatData = (data) => {
//       if (!data) return null;
      
//       return {
//         ...data,
//         producer: data?.producer?.toString(),
//         storedAmount: new BN(data.storedAmount).toString(),
//         consumedAmount: new BN(data.consumedAmount).toString(),
//         rate: new BN(data.rate).toString(),
//         balance: new BN(data.balance).toString(),
//         lastReconciled: new Date(data.lastReconciled * 1000).toLocaleString(),
//         transactions: data?.transactions?.map(tx => ({
//           ...tx,
//           txType: Object.keys(tx.txType)[0],
//           amount: new BN(tx.amount).toString(),
//           timestamp: new Date(tx.timestamp * 1000).toLocaleString()
//         }))
//       };
//     };

//     const formattedData = formatData(data);
//     console.log("formatted data : ",formattedData);
//     const [totalOwed, setTotalOwed] = useState({ toBob: 0, toProducers: 0 });
  
//     useEffect(() => {
//       let toBob = 0;
//       let toProducers = 0;
  
//       formattedData.transactions.forEach(tx => {
//         const amount = new BN(tx.amount).toNumber();
//         if (tx.txType === 'store') {
//           toBob += amount * batteryBankData?.storageFee?.toNumber();
//         } else if (tx.txType === 'consume') {
//           toProducers += amount * new BN(formattedData.rate).toNumber();
//         }
//       });
  
//       setTotalOwed({ toBob, toProducers });
//     }, []);
//     // }, [transactions, storageFee]);
  
//     return (
//       <Card className="mt-4">
//         <CardHeader>
//           <CardTitle>Transaction History</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Type</TableHead>
//                 <TableHead>Amount (kWh)</TableHead>
//                 <TableHead>Rate ($/kWh)</TableHead>
//                 <TableHead>Total ($)</TableHead>
//                 <TableHead>Timestamp</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {/* {transactions.map((tx, index) => { */}
//               {formattedData.transactions.map((tx, index) => {
//                 const txType = tx.txType === 'store' ? 'Stored Energy' : 'Consumed Energy';
//                 const rate = tx.txType === 'store' ? new BN(batteryBankData?.storageFee?.toNumber()): new BN(formattedData.rate);
//                 // const rate = tx.txType === 'store' ? new BN(batteryBankData?.storageFee?.toNumber()): new BN(tx.rate);
//                 const total = new BN(tx.amount).mul(rate);

//                 console.log(txType,rate.toString(), total.toString());
//                 console.log(rate, total);
  
//                 return (
//                   <TableRow key={index}>
//                     <TableCell>{txType}</TableCell>
//                     <TableCell>{new BN(tx.amount).toString()}</TableCell>
//                     <TableCell>${rate.toString()}</TableCell>
//                     <TableCell>${total.toString()}</TableCell>
//                     <TableCell>{tx.timestamp}</TableCell>
//                   </TableRow>
//                 );
//               })}
//             </TableBody>
//           </Table>
//           <div className="mt-4">
//             <h3 className="text-lg font-semibold">Summary</h3>
//             <p>Producers owe Bob (for storage): {totalOwed.toBob.toFixed(0)} $</p>
//             <p>Bob owes Producers (for consumed energy): {totalOwed.toProducers.toFixed(0)} $</p>
//             <p>
//               Net Balance: {Math.abs(totalOwed.toProducers - totalOwed.toBob).toFixed(0)} $ 
//               {totalOwed.toProducers > totalOwed.toBob 
//                 ? ' owed to Producers' 
//                 : ' owed to Bob'}
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   };


//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-3xl font-bold mb-6">Energy Storage Smart Contract</h1>
      
//       <div className="mb-4">
//         <WalletMultiButton className="!bg-blue-500 hover:!bg-blue-700 !text-white font-bold py-2 px-4 rounded" />
//       </div>

//       {publicKey ? (
//         <>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Initialize Battery Bank</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <Input
//                   type="number"
//                   placeholder="Storage Fee"
//                   value={storageFee}
//                   onChange={(e) => setStorageFee(e.target.value)}
//                   className="mb-2"
//                 />
//                 <Button onClick={handleInitialize}>Initialize</Button>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Store Energy</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <Input
//                   type="number"
//                   placeholder="Amount"
//                   value={storeAmount}
//                   onChange={(e) => setStoreAmount(e.target.value)}
//                   className="mb-2"
//                 />
//                 <Input
//                   type="number"
//                   placeholder="Rate"
//                   value={storeRate}
//                   onChange={(e) => setStoreRate(e.target.value)}
//                   className="mb-2"
//                 />
//                 <Button onClick={handleStoreEnergy}>Store Energy</Button>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 <CardTitle>Consume Energy</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <Input
//                   type="number"
//                   placeholder="Amount"
//                   value={consumeAmount}
//                   onChange={(e) => setConsumeAmount(e.target.value)}
//                   className="mb-2"
//                 />
//                 <Button onClick={handleConsumeEnergy}>Consume Energy</Button>
//               </CardContent>
//             </Card>
//           </div>

//         {message && (
//           <Card className="mt-4">
//             <CardContent>
//               <p className="text-center">{message}</p>
//             </CardContent>
//           </Card>
//         )}
        
//         {batteryBankData && producerData &&  (<TransactionList data={producerData} />)}
//         {batteryBankData && 
//           <div className="flex">
//             <AccountDataDisplay title="Battery Bank Data" data={batteryBankData} />
//             <AccountDataDisplay title="Producer Account Data" data={producerData} />
//           </div>
//         }
//         {/* {batteryBankData && <AccountDataDisplay title="Battery Bank Data" data={batteryBankData} />} */}
//         {/* {producerData && <AccountDataDisplay title="Producer Account Data" data={producerData} />} */}
//         {producerData && <EnergyChart producerData={producerData} />}

//         </>
//       ) : (
//         <p className="text-center mt-8">Please connect your wallet to use this app.</p>
//       )}

//     </div>
//   );
// }





















// "use client";
// import React, { useState, useEffect } from 'react';
// import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
// import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Battery, BatteryCharging, BatteryFull, Zap, DollarSign, BarChart2 } from 'lucide-react';
// import idl from '../idl/idl.json';

// const programID = new web3.PublicKey("BYBAEWJyCJnLQBmfArxPc4jJnKDy3GBDhCi1Z2GUh3b7");
// const idlObject = JSON.parse(JSON.stringify(idl));

// const Loader = () => (
//   <div className="flex justify-center items-center">
//     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
//   </div>
// );

// export default function Home() {
//   const { connection } = useConnection();
//   const { publicKey } = useWallet();
//   const anchorWallet=useAnchorWallet();
//   const [program, setProgram] = useState(null);
//   const [batteryBank, setBatteryBank] = useState(null);
//   const [producerAccount, setProducerAccount] = useState(null);
//   const [batteryBankData, setBatteryBankData] = useState(null);
//   const [producerData, setProducerData] = useState(null);
//   const [storageFee, setStorageFee] = useState('');
//   const [storeAmount, setStoreAmount] = useState('');
//   const [storeRate, setStoreRate] = useState('');
//   const [consumeAmount, setConsumeAmount] = useState('');
//   const [message, setMessage] = useState('');
//   const [latestData,setLatestData]=useState(null);

//    const [isLoading, setIsLoading] = useState(false);
//   const [isInitializing, setIsInitializing] = useState(false);
//   const [isStoring, setIsStoring] = useState(false);
//   const [isConsuming, setIsConsuming] = useState(false);

//   useEffect(() => {
//     const initializeProgram = async () => {
//       if (anchorWallet && connection && idlObject) {
//         try {
//           const provider = new AnchorProvider(connection, anchorWallet, {});
//           const program = new Program(idlObject, programID, provider);
//           setProgram(program);

//           const batteryBankKeypair = web3.Keypair.generate();
//           setBatteryBank(batteryBankKeypair);

//           if (publicKey) {
//             const producerAccountPDA = web3.PublicKey.findProgramAddressSync(
//               [Buffer.from("producer"), batteryBankKeypair.publicKey.toBuffer(), publicKey.toBuffer()],
//               program.programId
//             )[0];
//             setProducerAccount(producerAccountPDA);
//           }
//         } catch (error) {
//           console.error("Error initializing program:", error);
//           setMessage(`Error initializing program: ${error.message}`);
//         }
//       }
//     };

//     initializeProgram();
//   }, [anchorWallet, connection, publicKey]);

//   useEffect(() => {
//     const fetchAccountData = async () => {
//       if (program && batteryBank && producerAccount) {
//         try {
//           const batteryBankAccount = await program.account.batteryBank.fetch(batteryBank.publicKey);
//           setBatteryBankData(batteryBankAccount);

//           const producerAccountData = await program.account.producerAccount.fetch(producerAccount);
//           setProducerData(producerAccountData);
//         } catch (error) {
//           console.error("Error fetching account data:", error);
//         }
//       }
//     };

//     fetchAccountData();
//     const intervalId = setInterval(fetchAccountData, 10000); // Refresh every 10 seconds

//     return () => clearInterval(intervalId);
//   }, [program, batteryBank, producerAccount]);

//   const handleInitialize = async () => {
//     if (!program || !publicKey || !batteryBank) return;
//     setIsInitializing(true);

//     try {
//       const tx = await program.methods.initialize(new BN(storageFee))
//         .accounts({
//           batteryBank: batteryBank.publicKey,
//           owner: publicKey,
//           systemProgram: web3.SystemProgram.programId,
//         })
//         .signers([batteryBank])
//         .rpc();
//       setMessage(`Battery Bank initialized. Transaction: ${tx}`);
//     } catch (error) {
//       console.error('Error:', error);
//       setMessage(`Error: ${error.message}`);
//     }finally{
//       setIsInitializing(false);
//     }
//   };

//   const handleStoreEnergy = async () => {
//     if (!program || !publicKey || !batteryBank || !producerAccount) return;
//     setIsStoring(true);
//     try {
//       const tx = await program.methods.storeEnergy(new BN(storeAmount), new BN(storeRate))
//         .accounts({
//           batteryBank: batteryBank.publicKey,
//           producerAccount: producerAccount,
//           producer: publicKey,
//           systemProgram: web3.SystemProgram.programId,
//         })
//         .rpc();
//       setMessage(`Energy stored. Transaction: ${tx}`);
//     } catch (error) {
//       console.error('Error:', error);
//       setMessage(`Error: ${error.message}`);
//     }finally{
//       setIsStoring(false);
//     }
//   };

//   const handleConsumeEnergy = async () => {
//     if (!program || !publicKey || !batteryBank || !producerAccount) return;
//     setIsConsuming(true);
//     try {
//       const tx = await program.methods.consumeEnergy(new BN(consumeAmount))
//         .accounts({
//           batteryBank: batteryBank.publicKey,
//           producerAccount: producerAccount,
//           owner: publicKey,
//         })
//         .rpc();
//         setMessage(`Energy consumed. Transaction: ${tx}`);
//       } catch (error) {
//         console.error('Error:', error);
//         setMessage(`Error: ${error.message}`);
//       }finally{
//         setIsConsuming(true);
//       }
//   };

  
//     const AccountDataDisplay = ({ title, data,icon }) => {
//     const formatData = (data) => {
//       if (!data) return null;
      
//       return {
//         ...data,
//         producer: data?.producer?.toString(),
//         storedAmount: new BN(data.storedAmount).toString(),
//         consumedAmount: new BN(data.consumedAmount).toString(),
//         rate: new BN(data.rate).toString(),
//         balance: new BN(data.balance).toString(),
//         lastReconciled: new Date(data.lastReconciled * 1000).toLocaleString(),
//         transactions: data?.transactions?.map(tx => ({
//           ...tx,
//           txType: Object.keys(tx.txType)[0],
//           amount: new BN(tx.amount).toString(),
//           timestamp: new Date(tx.timestamp * 1000).toLocaleString()
//         }))
//       };
//     };

//     const formattedData = formatData(data);

//     return (
//       <Card className="mt-4">
//         <CardHeader>
//           <CardTitle className="flex items-center">{icon} {title}</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <pre className="whitespace-pre-wrap">{JSON.stringify(formattedData, null, 2)}</pre>
//         </CardContent>
//       </Card>
//     );
//   };

//     const EnergyChart = ({ producerData }) => {
//     const data = [
//       { name: 'Stored', energy: producerData ? new BN(producerData.storedAmount).toNumber() : 0 },
//       { name: 'Consumed', energy: producerData ? new BN(producerData.consumedAmount).toNumber() : 0 },
//     ];

//     return (
//       <Card className="mt-4">
//         <CardHeader>
//           <CardTitle className="flex items-center"><BarChart2 className="mr-2" /> Energy Overview</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={data}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="energy" fill="#8884d8" />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>
//     );
//   };


//   // const TransactionList = ({ transactions, storageFee }) => {
//   const TransactionList = ({ data }) => {
//     const formatData = (data) => {
//       if (!data) return null;
      
//       return {
//         ...data,
//         producer: data?.producer?.toString(),
//         storedAmount: new BN(data.storedAmount).toString(),
//         consumedAmount: new BN(data.consumedAmount).toString(),
//         rate: new BN(data.rate).toString(),
//         balance: new BN(data.balance).toString(),
//         lastReconciled: new Date(data.lastReconciled * 1000).toLocaleString(),
//         transactions: data?.transactions?.map(tx => ({
//           ...tx,
//           txType: Object.keys(tx.txType)[0],
//           amount: new BN(tx.amount).toString(),
//           timestamp: new Date(tx.timestamp * 1000).toLocaleString()
//         }))
//       };
//     };

//     const formattedData = formatData(data);
//     console.log("formatted data : ",formattedData);
//     const [totalOwed, setTotalOwed] = useState({ toBob: 0, toProducers: 0 });
  
//     useEffect(() => {
//       let toBob = 0;
//       let toProducers = 0;
  
//       formattedData.transactions.forEach(tx => {
//         const amount = new BN(tx.amount).toNumber();
//         if (tx.txType === 'store') {
//           toBob += amount * batteryBankData?.storageFee?.toNumber();
//         } else if (tx.txType === 'consume') {
//           toProducers += amount * new BN(formattedData.rate).toNumber();
//         }
//       });
  
//       setTotalOwed({ toBob, toProducers });
//     }, []);
//     // }, [transactions, storageFee]);
  
//     return (
//       <Card className="mt-4">
//         <CardHeader>
//           <CardTitle className="flex items-center"><DollarSign className="mr-2" /> Transaction History</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Type</TableHead>
//                 <TableHead>Amount (kWh)</TableHead>
//                 <TableHead>Rate ($/kWh)</TableHead>
//                 <TableHead>Total ($)</TableHead>
//                 <TableHead>Timestamp</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {/* {transactions.map((tx, index) => { */}
//               {formattedData.transactions.map((tx, index) => {
//                 const txType = tx.txType === 'store' ? 'Stored Energy' : 'Consumed Energy';
//                 const rate = tx.txType === 'store' ? new BN(batteryBankData?.storageFee?.toNumber()): new BN(formattedData.rate);
//                 // const rate = tx.txType === 'store' ? new BN(batteryBankData?.storageFee?.toNumber()): new BN(tx.rate);
//                 const total = new BN(tx.amount).mul(rate);

//                 console.log(txType,rate.toString(), total.toString());
//                 console.log(rate, total);
  
//                 return (
//                   <TableRow key={index}>
//                     <TableCell>{txType}</TableCell>
//                     <TableCell>{new BN(tx.amount).toString()}</TableCell>
//                     <TableCell>${rate.toString()}</TableCell>
//                     <TableCell>${total.toString()}</TableCell>
//                     <TableCell>{tx.timestamp}</TableCell>
//                   </TableRow>
//                 );
//               })}
//             </TableBody>
//           </Table>
//           <div className="mt-4">
//             <h3 className="text-lg font-semibold">Summary</h3>
//             <p>Producers owe Bob (for storage): {totalOwed.toBob.toFixed(0)} $</p>
//             <p>Bob owes Producers (for consumed energy): {totalOwed.toProducers.toFixed(0)} $</p>
//             <p>
//               Net Balance: {Math.abs(totalOwed.toProducers - totalOwed.toBob).toFixed(0)} $ 
//               {totalOwed.toProducers > totalOwed.toBob 
//                 ? ' owed to Producers' 
//                 : ' owed to Bob'}
//             </p>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   };


//   return (
//     <div className="container mx-auto p-4">
//       {/* <h1 className="text-3xl font-bold mb-6">Energy Storage Smart Contract</h1> */}
//       <h1 className="text-3xl font-bold mb-6 flex items-center">
//         <Battery className="mr-2" /> Energy Storage Smart Contract
//       </h1>
//       <div className="mb-4">
//         <WalletMultiButton className="!bg-blue-500 hover:!bg-blue-700 !text-white font-bold py-2 px-4 rounded" />
//       </div>

//       {publicKey ? (
//         <>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <Card>
//               <CardHeader>
//                 {/* <CardTitle>Initialize Battery Bank</CardTitle> */}
//                 <CardTitle className="flex items-center">
//                     <BatteryFull className="mr-2" /> Initialize Battery Bank
//                   </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <Input
//                   type="number"
//                   placeholder="Storage Fee"
//                   value={storageFee}
//                   onChange={(e) => setStorageFee(e.target.value)}
//                   className="mb-2"
//                 />
//                 {/* <Button onClick={handleInitialize}>Initialize</Button> */}
//                 <Button onClick={handleInitialize} disabled={isInitializing}>
//                   {isInitializing ? <Loader /> : 'Initialize'}
//                 </Button>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 {/* <CardTitle>Store Energy</CardTitle> */}
//                 <CardTitle className="flex items-center">
//                   <BatteryCharging className="mr-2" /> Store Energy
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <Input
//                   type="number"
//                   placeholder="Amount"
//                   value={storeAmount}
//                   onChange={(e) => setStoreAmount(e.target.value)}
//                   className="mb-2"
//                 />
//                 <Input
//                   type="number"
//                   placeholder="Rate"
//                   value={storeRate}
//                   onChange={(e) => setStoreRate(e.target.value)}
//                   className="mb-2"
//                 />
//                 {/* <Button onClick={handleStoreEnergy}>Store Energy</Button> */}
//                 <Button onClick={handleStoreEnergy} disabled={isStoring}>
//                   {isStoring ? <Loader /> : 'Store Energy'}
//                 </Button>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader>
//                 {/* <CardTitle>Consume Energy</CardTitle> */}
//                 <CardTitle className="flex items-center">
//                   <Zap className="mr-2" /> Consume Energy
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <Input
//                   type="number"
//                   placeholder="Amount"
//                   value={consumeAmount}
//                   onChange={(e) => setConsumeAmount(e.target.value)}
//                   className="mb-2"
//                 />
//                 {/* <Button onClick={handleConsumeEnergy}>Consume Energy</Button> */}
//                 <Button onClick={handleConsumeEnergy} disabled={isConsuming}>
//                   {isConsuming ? <Loader /> : 'Consume Energy'}
//                 </Button>
//               </CardContent>
//             </Card>
//           </div>

//         {message && (
//           <Card className="mt-4">
//             <CardContent>
//               <p className="text-center">{message}</p>
//             </CardContent>
//           </Card>
//         )}
        
//         {isLoading ? (
//             <Loader />
//           ) : (
//             <>
//               {batteryBankData && producerData && (<TransactionList data={producerData} />)}
//               {batteryBankData && 
//                 <div className="flex">
//                   <AccountDataDisplay title="Battery Bank Data" data={batteryBankData} icon={<BatteryFull />} />
//                   <AccountDataDisplay title="Producer Account Data" data={producerData} icon={<Zap />} />
//                 </div>
//               }
//               {producerData && <EnergyChart producerData={producerData} />}
//         </>
//           )}
//         </>
//       ) : (
//         <p className="text-center mt-8">Please connect your wallet to use this app.</p>
//       )}
//     </div>
//   );
// }


