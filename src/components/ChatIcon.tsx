// src/components/ChatIcon.tsx
'use client'
import React, { useState } from 'react';
import { FaComments } from 'react-icons/fa';

const ChatIcon: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
      <button
        onClick={toggleModal}
        className="fixed bottom-4 left-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        aria-label="Open chat"
      >
        <FaComments size={24} />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-zinc-800 w-3/4 h-3/4 rounded-lg shadow-xl overflow-hidden">
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
      )}
    </>
  );
};

export default ChatIcon;
