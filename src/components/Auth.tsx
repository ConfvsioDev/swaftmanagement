'use client'

import { Auth } from '@supabase/auth-ui-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthComponent() {
  const supabase = createClientComponentClient()

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
        <div className="flex justify-center mb-4">
          <button 
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'discord' })}
            className="flex items-center bg-[#5865F2] text-white px-4 py-2 rounded-lg hover:bg-[#4752C4] transition duration-300"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              className="mr-2"
            >
              {/* SVG path omitted for brevity */}
            </svg>
            Connexion avec Discord
          </button>
        </div>
      </div>
    </div>
  )
}
