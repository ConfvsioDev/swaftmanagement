// src/components/NicknameModal.tsx
import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function NicknameModal({ onClose, onNicknameSet }: { onClose: () => void; onNicknameSet: (nickname: string) => void }) {
  const [nickname, setNickname] = useState('');
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Upsert the profile
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        nickname: nickname,
        avatar_url: user.user_metadata.avatar_url || null // Use existing avatar URL or null
      });
  
      if (error) {
        console.error('Error saving nickname:', error.message);
        return;
      }
      
      onNicknameSet(nickname); // Update nickname in the dashboard
      onClose(); // Close modal after saving
    }
  };
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-sm w-full border border-slate-600">
        <h2 className="text-xl font-semibold text-white mb-4">Choose a Nickname</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full p-3 mb-4 bg-slate-700 text-white rounded border border-slate-600 focus:outline-none focus:ring focus:ring-blue-500 transition duration-200"
            placeholder="Enter your Nickname"
            required
          />
          <button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded transition duration-200 border border-blue-600"
          >
            Save Nickname
          </button>
        </form>
      </div>
    </div>
  );
}
