// src/components/ChatIcon.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { FaComments } from 'react-icons/fa';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/auth-helpers-nextjs';

// Define types for our chat structures
type Message = {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
};

type Room = {
  id: string;
  name: string;
  messages: Message[];
};

const ChatIcon: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'private' | 'public'>('private');
  const [privateMessages, setPrivateMessages] = useState<Message[]>([]);
  const [publicRooms, setPublicRooms] = useState<Room[]>([
    { id: '1', name: 'General', messages: [] },
    { id: '2', name: 'Feed-back', messages: [] },
    { id: '3', name: 'Business', messages: [] },
  ]);
  const [activeRoom, setActiveRoom] = useState<string>('1');
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUserData();
    // In a real app, you would fetch actual messages and update unreadCount here
  }, [supabase]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (isModalOpen) {
      setUnreadCount(0); // Reset unread count when opening the modal
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const message: Message = {
      id: Date.now().toString(),
      sender: user?.email || 'Anonymous',
      content: newMessage,
      timestamp: new Date(),
    };

    if (activeTab === 'private') {
      setPrivateMessages([...privateMessages, message]);
    } else {
      setPublicRooms(publicRooms.map(room => 
        room.id === activeRoom 
          ? { ...room, messages: [...room.messages, message] }
          : room
      ));
    }

    setNewMessage('');
  };

  if (loading || !user) {
    return null;
  }

  return (
    <>
      <button
        onClick={toggleModal}
        className="fixed bottom-4 right-4 bg-zinc-950 text-white p-3 rounded-full shadow-lg hover:bg-zinc-900 transition-colors"
        aria-label="Open chat"
      >
        <FaComments size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-zinc-800 w-3/4 h-3/4 rounded-lg shadow-xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-zinc-700">
              <h2 className="text-xl font-bold">Chat</h2>
              <button onClick={toggleModal} className="text-gray-400 hover:text-white">
                Close
              </button>
            </div>
            <div className="flex border-b border-zinc-700">
              <button
                className={`px-4 py-2 ${activeTab === 'private' ? 'bg-zinc-700' : ''}`}
                onClick={() => setActiveTab('private')}
              >
                Private Messages
              </button>
              <button
                className={`px-4 py-2 ${activeTab === 'public' ? 'bg-zinc-700' : ''}`}
                onClick={() => setActiveTab('public')}
              >
                Public Rooms
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'private' ? (
                <div>
                  {privateMessages.map(message => (
                    <div key={message.id} className="mb-2">
                      <strong>{message.sender}:</strong> {message.content}
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <select 
                    value={activeRoom} 
                    onChange={(e) => setActiveRoom(e.target.value)}
                    className="mb-4 bg-zinc-700 text-white p-2 rounded"
                  >
                    {publicRooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                  {publicRooms.find(room => room.id === activeRoom)?.messages.map(message => (
                    <div key={message.id} className="mb-2">
                      <strong>{message.sender}:</strong> {message.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-zinc-700">
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-zinc-700 text-white p-2 rounded-l"
                  placeholder="Type a message..."
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 text-white p-2 rounded-r"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatIcon;
