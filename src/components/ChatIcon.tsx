// src/components/ChatIcon.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Users, Globe } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/auth-helpers-nextjs';

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
  const [unreadCount, setUnreadCount] = useState(0);

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
  }, [activeRoom, supabase]);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('id, name')
      .order('name');
    if (data) {
      setRooms(data);
      setActiveRoom(data[0]?.id || null);
    }
  };

  const fetchMessages = async (roomId: string) => {
    const { data, error } = await supabase
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
        user: {
          nickname: message.user[0].nickname,
          avatar_url: message.user[0].avatar_url
        }
      }));
      setMessages(formattedMessages.reverse());
    }
  };
  

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !activeRoom || !user) return;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: activeRoom,
        user_id: user.id,
        content: newMessage
      })
      .select();

    if (data) {
      setNewMessage('');
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
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
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-100 transition-colors">
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
              {activeTab === 'public' && (
                <>
                  <select 
                    value={activeRoom || ''}
                    onChange={(e) => setActiveRoom(e.target.value)}
                    className="mb-4 bg-zinc-700 text-zinc-100 p-2 rounded-lg w-full"
                  >
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                  </select>
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div key={message.id} className="bg-zinc-700 rounded-lg p-3">
                        <div className="flex items-center mb-1">
                          <img src={message.user.avatar_url || '/default-avatar.png'} alt={message.user.nickname} className="w-6 h-6 rounded-full mr-2" />
                          <span className="font-semibold text-zinc-100">{message.user.nickname}</span>
                          <span className="text-xs text-zinc-400 ml-auto">{new Date(message.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-zinc-200">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="p-4 bg-zinc-800">
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
