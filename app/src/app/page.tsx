import EnergyStorageUI from '../components/EnergyStorageUI';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold mb-8">Energy Storage Dashboard</h1>
      <EnergyStorageUI />
      <p>ji</p>
    </main>
  );
}