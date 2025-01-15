// src/components/ChatIcon.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { FaComments } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const ChatIcon: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUserData();
  }, [supabase]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  if (loading || !user) {
    return null; // Don't render anything if loading or user is not logged in
  }

  return (
    <>
      <button
        onClick={toggleModal}
        className="fixed bottom-4 right-4 bg-zinc-950 text-white p-3 rounded-full shadow-lg hover:bg-zinc-900 transition-colors"
        aria-label="Open chat"
      >
        <FaComments size={24} />
      </button>

      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center transition-opacity duration-300 ${
          isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`bg-zinc-800 w-3/4 h-3/4 rounded-lg shadow-xl overflow-hidden transition-all duration-300 ${
            isModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div className="flex justify-between items-center p-4 border-b border-zinc-700">
            <h2 className="text-xl font-bold">Inbox</h2>
            <button onClick={toggleModal} className="text-gray-400 hover:text-white">
              Close
            </button>
          </div>
          <div className="p-4">
            {/* Add your inbox content here */}
            <p>Your messages will appear here.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatIcon;
