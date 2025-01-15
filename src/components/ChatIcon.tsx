'use client'

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, ChevronDown } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

type Message = {
  id: string;
  content: string;
  created_at: string;
  user_id: string; // Added user_id property
  user: {
    nickname: string;
    avatar_url: string;
  };
};

type Room = {
  id: string;
  name: string;
  type: 'public' | 'private';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClientComponentClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const fetchRooms = async () => {
    const { data } = await supabase
      .from('rooms')
      .select('id, name, type')
      .order('name');
    if (data) {
      setRooms(data);
      setActiveRoom(data[0]?.id || null);
    }
  };

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom);
      const subscription = supabase
        .channel(`room:${activeRoom}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `room_id=eq.${activeRoom}` 
        }, async (payload) => {
          const newMessageData = payload.new as Message; // Specify type here
          // Format the message with user data
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, avatar_url')
            .eq('id', newMessageData.user_id)
            .single();

          if (profile) {
            setMessages(current => [...current, {
              id: newMessageData.id,
              content: newMessageData.content,
              created_at: newMessageData.created_at,
              user_id: newMessageData.user_id, // Include user_id
              user: {
                nickname: profile.nickname || 'Anonymous',
                avatar_url: profile.avatar_url || '/default-avatar.png'
              }
            }]);
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [activeRoom]); // Add activeRoom to dependencies

  const fetchMessages = async (roomId: string) => {
    const { data } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles!messages_user_id_fkey (
          nickname,
          avatar_url
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (data) {
      const formattedMessages: Message[] = data.map((message) => ({
        id: message.id,
        content: message.content,
        created_at: message.created_at,
        user_id: message.user_id, // Include user_id here
        user: {
          nickname: message.profiles[0]?.nickname || 'Anonymous',
          avatar_url: message.profiles[0]?.avatar_url || '/default-avatar.png',
        },
      }));
      setMessages(formattedMessages);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (newMessage.trim() === '' || !activeRoom || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: activeRoom,
          user_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
};

if (loading || !user) return null;

return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center"
        aria-label="Open chat"
      >
        <MessageSquare size={24} />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 w-full max-w-4xl h-[80vh] rounded-2xl shadow-xl overflow-hidden flex flex-col border border-zinc-800">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-zinc-800/50 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-bold text-zinc-100">Chat</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors"
              >
                <X size={20} className="text-zinc-400 hover:text-zinc-200" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-700/50">
              <button
                className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
                  activeTab === 'public' 
                    ? 'bg-zinc-800/50 text-blue-500 border-b-2 border-blue-500' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                onClick={() => setActiveTab('public')}
              >
                Salons Publics
              </button>
              <button
                className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
                  activeTab === 'private'
                    ? 'bg-zinc-800/50 text-blue-500 border-b-2 border-blue-500'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                onClick={() => setActiveTab('private')}
              >
                Messages Privés
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0">
              {activeTab === 'public' && (
                <>
                  {/* Room Selector */}
                  <div className="p-4 border-b border-zinc-700/50">
                    <div className="relative">
                      <select 
                        value={activeRoom || ''}
                        onChange={(e) => setActiveRoom(e.target.value)}
                        className="w-full appearance-none bg-zinc-800 text-zinc-100 px-4 py-2 pr-10 rounded-lg border border-zinc700 focus:outline-none focus:border-blue500 transition-colors"
                      >
                        {rooms.filter(room => room.type === 'public').map(room => (
                          <option key={room.id} value={room.id}>{room.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top1/2 -translate-y1/2 text-zinc400 pointer-events-none h5 w5" />
                    </div>
                  </div>

                  {/* Messages */}
                  <div 
                    ref={messagesEndRef}
                    className="flex1 overflow-y-auto p4 space-y4"
                  >
                    {messages.map((message) => (
                      <div key={message.id} className="flex items-start gap3 mt4">
                        <Image
                          src={message.user.avatar_url}
                          alt={message.user.nickname}
                          width={36}
                          height={36}
                          className="rounded-full"
                        />
                        <div className="flex1">
                          <div className="flex items-baseline gap2 mb1">
                            <span className="font-medium text-zinc100">{message.user.nickname}</span>
                            <span className="text-xs text-zinc500">{new Date(message.created_at).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-zinc300 bg-zinc800/50 rounded-lg py2 px3 break-word">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p4 bg-zinc800/30 border-t border-zinc700/50">
              <div className="flex gap2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex1 bg-zinc800 text-zinc100 px4 py2 rounded-lg border border-zinc700 focus:outline-none focus:border-blue500 transition-colors"
                  placeholder="Écrivez votre message..."
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue600 text-white px4 py2 rounded-lg hover:bg-blue700 transition-colors disabled:bg-blue500 disabled:cursor-notallowed flex items-center gap2"
                >
                  <Send size={18} />
                  <span>Envoyer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatIcon;
