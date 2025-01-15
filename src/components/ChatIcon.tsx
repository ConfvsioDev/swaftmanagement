'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, Hash, Lock } from 'lucide-react'; 
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
          nickname: profile?.nickname || 'Anonyme',
          avatar_url: profile?.avatar_url || 'https://source.unsplash.com/random/100x100/?avatar',
        });
      }
      setLoading(false);
    };

    fetchUserData();
  }, [supabase]);

  useEffect(() => {
    const fetchRooms = async () => {
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('*')
        .eq('type', activeTab === 'public' ? 'public' : 'private')
        .order('created_at', { ascending: true });

      if (roomsData) {
        setRooms(roomsData);
        if (!activeRoom && roomsData.length > 0) {
          setActiveRoom(roomsData[0]);
        }
      }
    };

    fetchRooms();
  }, [activeTab, activeRoom, supabase]);

  useEffect(() => {
    if (!activeRoom) return;

    const channel = supabase
      .channel(`room:${activeRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${activeRoom.id}`,
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
          nickname: message.profiles?.nickname || 'Anonyme',
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
      console.error('Erreur d\'envoi du message:', error);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center transform hover:scale-105"
        aria-label="Ouvrir le chat"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-xl overflow-hidden flex flex-col border border-zinc-800 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-bold text-zinc-100">Discussion</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-zinc-700/50 rounded-lg transition-colors"
              >
                <X className="text-zinc-400 hover:text-zinc-200" />
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

            <div className="flex flex-grow min-h-0">
              <div className="w-64 bg-zinc-800/30 border-r border-zinc-700/50 flex flex-col">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3">
                    {activeTab === 'public' ? 'Salons Publics' : 'Discussions Privées'}
                  </h3>
                  <div className="space-y-1">
                    {rooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setActiveRoom(room)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                          activeRoom?.id === room.id
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-zinc-300 hover:bg-zinc-700/50'
                        }`}
                      >
                        {activeTab === 'public' ? (
                          <Hash className="w-4 h-4 text-zinc-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-zinc-500" />
                        )}
                        <span className="truncate">{room.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

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
                          <div className="flex-shrink-0">
                            <Image
                              src={message.user.avatar_url}
                              alt={message.user.nickname}
                              width={36}
                              height={36}
                              className="rounded-full"
                            />
                          </div>
                          <div
                            className={`flex flex-col ${
                              message.user_id === user.id ? 'items-end' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-100">
                                {message.user.nickname}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p
                              className={`text-zinc-300 rounded-lg py-2 px-3 mt-1 max-w-md ${
                                message.user_id === user.id
                                  ? 'bg-blue-500/20 text-blue-100'
                                  : 'bg-zinc-800/50'
                              }`}
                            >
                              {message.content}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <form
                      onSubmit={handleSendMessage}
                      className="p-4 bg-zinc-800/30 border-t border-zinc-700/50"
                    >
                      <div className="flex gap-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-grow bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="Écrivez votre message..."
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className={`bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center gap-2 ${
                            !newMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-grow flex items-center justify-center">
                    <p className="text-zinc-500">Sélectionnez un salon pour commencer à discuter</p>
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