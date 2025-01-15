// src/components/ChatIcon.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react'; // Removed unused imports
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

type Message = {
  id: string;
  content: string;
  created_at: string;
  user: {
    nickname: string;
    avatar_url: string;
  };
};

type Room = {
  id: string;
  name: string;
};

const ChatIcon: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'private' | 'public'>('public');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchRooms();
      }
      setLoading(false);
    };

    fetchUserData();
  }, [supabase]);

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom);
      const subscription = supabase
        .channel(`room:${activeRoom}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoom}` }, payload => {
          setMessages(current => [...current, payload.new as Message]);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [activeRoom, supabase]); // Ensure that fetchMessages is included if defined

  const fetchRooms = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('id, name')
      .order('name');
    if (data) {
      setRooms(data);
      setActiveRoom(data[0]?.id || null);
    }
  };

  const fetchMessages = async (roomId: string) => {
    const { data } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        user:profiles(nickname, avatar_url)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      const formattedMessages: Message[] = data.map(message => ({
        id: message.id,
        content: message.content,
        created_at: message.created_at,
        user: message.user[0], // Accessing the first user object directly
      }));
      setMessages(formattedMessages.reverse());
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !activeRoom || !user) return;

    await supabase
      .from('messages')
      .insert({
        room_id: activeRoom,
        user_id: user.id,
        content: newMessage
      });

    setNewMessage('');
    fetchMessages(activeRoom); // Fetch messages again to update the UI
  };

  if (loading || !user) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 right-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300"
        aria-label="Open chat"
      >
        <MessageSquare size={24} />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white w-full md:w-3/4 lg:w-2/3 xl:w-1/2 h-3/4 rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 bg-blue-600 text-white">
              <h2 className="text-xl font-bold">Chat</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex border-b border-gray-300">
              <button
                className={`flex-grow py-2 text-center ${activeTab === 'private' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                onClick={() => setActiveTab('private')}
              >
                Messages Privés
              </button>
              <button
                className={`flex-grow py-2 text-center ${activeTab === 'public' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                onClick={() => setActiveTab('public')}
              >
                Public Rooms
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
              {activeTab === 'public' && (
                <>
                  <select 
                    value={activeRoom || ''}
                    onChange={(e) => setActiveRoom(e.target.value)}
                    className="mb-4 bg-gray-200 text-black p-2 rounded-lg w-full"
                  >
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div key={message.id} className="bg-white border rounded-lg p-3 shadow-sm">
                        <div className="flex items-center mb-1">
                          <Image src={message.user.avatar_url || '/default-avatar.png'} alt={message.user.nickname} width={32} height={32} className="rounded-full mr-2" />
                          <span className="font-semibold">{message.user.nickname}</span>
                          <span className="text-xs text-gray-500 ml-auto">{new Date(message.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p>{message.content}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="p-4 bg-gray-200">
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-grow bg-white text-black p-2 rounded-l-lg focus:outline-none focus:ring focus:ring-blue-500"
                  placeholder="Type a message..."
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700 transition-colors"
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
