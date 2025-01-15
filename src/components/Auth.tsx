'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaDiscord } from 'react-icons/fa'; // Make sure to install react-icons

export default function AuthComponent() {
  const supabase = createClientComponentClient();

  return (
    <div className="w-full max-w-md">
      <div className="bg-zinc-800 rounded-xl p-8 shadow-2xl border border-zinc-700">
        <h2 className="text-2xl font-bold text-center mb-6 text-zinc-100">Bienvenue sur Swaft</h2>
        <p className="text-zinc-400 text-center mb-8">Connectez-vous pour accéder au tableau de bord</p>
        <button 
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'discord' })}
          className="w-full flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FaDiscord className="mr-2 text-xl" />
          <span className="font-medium">Connexion avec Discord</span>
        </button>
      </div>
    </div>
  );
}
