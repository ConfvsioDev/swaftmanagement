// src/components/ChatIcon.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Users, Globe } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/auth-helpers-nextjs';

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
    { id: '1', name: 'Général', messages: [] },
    { id: '2', name: 'Retours', messages: [] },
    { id: '3', name: 'Affaires', messages: [] },
  ]);
  const [activeRoom, setActiveRoom] = useState<string>('1');
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(3);

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
    if (isModalOpen) {
      setUnreadCount(0);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const message: Message = {
      id: Date.now().toString(),
      sender: user?.email || 'Anonyme',
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
        className="fixed bottom-4 right-4 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-3 rounded-full shadow-lg hover:from-indigo-700 hover:to-indigo-900 transition-all duration-300"
        aria-label="Ouvrir le chat"
      >
        <MessageSquare size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-zinc-900 w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 h-3/4 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 bg-zinc-800">
              <h2 className="text-xl font-bold text-zinc-100">Chat</h2>
              <button onClick={toggleModal} className="text-zinc-400 hover:text-zinc-100 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex border-b border-zinc-700">
              <button
                className={`px-4 py-2 ${activeTab === 'private' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400'}`}
                onClick={() => setActiveTab('private')}
              >
                <Users size={18} className="inline mr-2" />
                Messages Privés
              </button>
              <button
                className={`px-4 py-2 ${activeTab === 'public' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400'}`}
                onClick={() => setActiveTab('public')}
              >
                <Globe size={18} className="inline mr-2" />
                Salons Publics
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-zinc-800/50">
              {activeTab === 'private' ? (
                <div className="space-y-4">
                  {privateMessages.map(message => (
                    <div key={message.id} className="bg-zinc-700 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-zinc-100">{message.sender}</span>
                        <span className="text-xs text-zinc-400">{message.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <p className="text-zinc-200">{message.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <select 
                    value={activeRoom} 
                    onChange={(e) => setActiveRoom(e.target.value)}
                    className="mb-4 bg-zinc-700 text-zinc-100 p-2 rounded-lg w-full"
                  >
                    {publicRooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                  <div className="space-y-4">
                    {publicRooms.find(room => room.id === activeRoom)?.messages.map(message => (
                      <div key={message.id} className="bg-zinc-700 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-zinc-100">{message.sender}</span>
                          <span className="text-xs text-zinc-400">{message.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <p className="text-zinc-200">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-zinc-800">
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-zinc-700 text-zinc-100 p-2 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tapez un message..."
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-2 rounded-r-lg hover:from-indigo-700 hover:to-indigo-900 transition-colors"
                >
                  <Send size={20} />
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
