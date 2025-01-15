// src/app/ClientLayout.tsx

'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Session } from '@supabase/supabase-js';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <div className="flex h-screen overflow-hidden">
      {session && <Sidebar />}
      <main className={`flex-1 overflow-y-auto ${session ? 'ml-64' : ''}`}>
        {children}
      </main>
    </div>
  );
}
