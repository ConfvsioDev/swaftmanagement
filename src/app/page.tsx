import RootLayout from './layout';
import Dashboard from '@/components/Dashboard';

export default async function Home() {
  return (
    <RootLayout>
      <Dashboard />
    </RootLayout>
  );
}