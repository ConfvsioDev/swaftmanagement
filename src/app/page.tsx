// src/app/page.tsx
import RootLayout from './layout'; // Importation de RootLayout
import Dashboard from '@/components/Dashboard';

export default async function Home() {
  return (
    <RootLayout> {/* Use RootLayout without additional props for user */}
      {/* Composant Dashboard */}
      <Dashboard />
    </RootLayout>
  );
}
