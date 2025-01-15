// layout.tsx
import './globals.css';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: "Gestion Swaft",
  description: "Outils de Gestion de Swaft",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-zinc-900 text-gray-200">
        <div className="flex h-screen overflow-hidden">
          {session && <Sidebar />}
          <main className={`flex-1 overflow-y-auto ${session ? 'ml-64' : ''}`}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
