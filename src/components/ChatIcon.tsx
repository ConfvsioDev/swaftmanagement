'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, Hash, Lock } from 'lucide-react'; // Removed Plus
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User as SupabaseUser } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

type Message = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  room_id: string;
  private: boolean;
  user: {
    nickname: string;
    avatar_url: string;
  };
};

type Room = {
  id: string;
  name: string;
  type: string;
};

type UserProfile = SupabaseUser & {
  nickname?: string;
  avatar_url?: string;
};

const ChatIcon: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, avatar_url')
          .eq('id', user.id)
          .single();

        setUser({
          ...user,
          nickname: profile?.nickname || 'Anonymous',
          avatar_url: profile?.avatar_url || 'https://source.unsplash.com/random/100x100/?avatar',
        });
      }
      setLoading(false);
    };

    fetchUserData();
  }, [supabase]);

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .eq('type', activeTab === 'public' ? 'public' : 'private');

      if (roomsData) {
        setRooms(roomsData);
        if (!activeRoom && roomsData.length > 0) {
          setActiveRoom(roomsData[0]);
        }
      }
    };

    fetchRooms();
  }, [activeTab, activeRoom, supabase]); // Added activeRoom to dependencies

  // Real-time messages subscription
  useEffect(() => {
    if (!activeRoom) return;

    const subscription = supabase
      .channel(`room:${activeRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${activeRoom.id}`,
      }, (payload) => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeRoom, supabase]);

  const fetchMessages = useCallback(async () => {
    if (!activeRoom) return;

    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        profiles:user_id (
          nickname,
          avatar_url
        )
      `)
      .eq('room_id', activeRoom.id)
      .eq('private', activeTab === 'private')
      .order('created_at', { ascending: true });

    if (data) {
      const formattedMessages: Message[] = data.map((message) => ({
        ...message,
        user: {
          nickname: message.profiles?.nickname || 'Anonymous',
          avatar_url: message.profiles?.avatar_url || 'https://source.unsplash.com/random/100x100/?avatar',
        },
      }));
      setMessages(formattedMessages);
      scrollToBottom();
    }
  }, [activeRoom, activeTab, supabase, scrollToBottom]);

  useEffect(() => {
    if (activeRoom) {
      fetchMessages();
    }
  }, [activeRoom, fetchMessages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newMessage.trim() === '' || !user || !activeRoom) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: activeRoom.id,
          user_id: user.id,
          content: newMessage.trim(),
          private: activeTab === 'private',
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
          <div className="bg-zinc-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-xl overflow-hidden flex flex-col border border-zinc-800">
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

            <div className="flex border-b border-zinc-700/50">
              <button
                className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
                  activeTab === 'public'
                    ? 'bg-zinc-800/50 text-blue-500 border-b-2 border-blue-500'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                onClick={() => setActiveTab('public')}
              >
                Public Rooms
              </button>
              <button
                className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
                  activeTab === 'private'
                    ? 'bg-zinc-800/50 text-blue-500 border-b-2 border-blue-500'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                onClick={() => setActiveTab('private')}
              >
                Private Messages
              </button>
            </div>

            <div className="flex flex-grow min-h-0">
              {/* Rooms Sidebar */}
              <div className="w-64 bg-zinc-800/30 border-r border-zinc-700/50 flex flex-col">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3">
                    {activeTab === 'public' ? 'Public Rooms' : 'Private Chats'}
                  </h3>
                  <div className="space-y-1">
                    {rooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setActiveRoom(room)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
                          activeRoom?.id === room.id
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-zinc-300 hover:bg-zinc-700/50'
                        }`}
                      >
                        {activeTab === 'public' ? (
                          <Hash size={18} className="text-zinc-500" />
                        ) : (
                          <Lock size={18} className="text-zinc-500" />
                        )}
                        <span className="truncate">{room.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-grow flex flex-col">
                {activeRoom ? (
                  <>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex items-start gap-3 ${
                            message.user_id === user.id ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <Image
                            src={message.user.avatar_url}
                            alt={message.user.nickname}
                            width={36}
                            height={36}
                            className="rounded-full"
                          />
                          <div className={`flex flex-col ${
                            message.user_id === user.id ? 'items-end' : ''
                          }`}>
                            <span className="font-medium text-zinc-100">
                              {message.user.nickname}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </span>
                            <p className={`text-zinc-300 rounded-lg py-2 px-3 mt-1 max-w-md ${
                              message.user_id === user.id
                                ? 'bg-blue-500/20 text-blue-100'
                                : 'bg-zinc-800/50'
                            }`}>
                              {message.content}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 bg-zinc-800/30 border-t border-zinc-700/50">
                      <div className="flex gap-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-grow bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="Type your message..."
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ${
                            !newMessage.trim() ? 'opacity-50 cursor-notallowed' : ''
                          }`}
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-grow flex items-center justify-center">
                    <p className="text-zinc500">Select a room to start chatting</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatIcon;
