'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaDiscord } from 'react-icons/fa';
import Image from 'next/image';
import logo from '../../public/logo.png';
import { useState } from 'react';

export default function AuthComponent() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ provider: 'discord' });
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-zinc-800 rounded-xl p-8 shadow-2xl border border-zinc-700">
        <div className="flex justify-center mb-6">
          <Image
            src={logo}
            alt="Swaft Logo"
            width={80}
            height={80}
            className="rounded-full border border-zinc-600"
          />
        </div>

        <h2 className="text-2xl font-bold text-center mb-6 text-zinc-100">Bienvenue sur Swaft</h2>
        <p className="text-zinc-400 text-center mb-8">Connecte-toi pour accéder au tableau de bord</p>
        <button 
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
          ) : (
            <>
              <FaDiscord className="mr-2 text-xl" />
              <span className="font-medium">Connexion avec Discord</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
