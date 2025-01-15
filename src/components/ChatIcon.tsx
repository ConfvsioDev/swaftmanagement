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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isModalMounted, setIsModalMounted] = useState(false);
  
  // Add this function to handle initial scroll
  useEffect(() => {
    if (isModalOpen) {
      // Set a small delay to ensure the modal is mounted
      const timer = setTimeout(() => {
        setIsModalMounted(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsModalMounted(false);
    }
  }, [isModalOpen]);

  // Handle initial scroll when modal is mounted
  useEffect(() => {
    if (isModalMounted && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [isModalMounted, messages]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current && isModalMounted) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isModalMounted]);

  // Scroll on new messages
  useEffect(() => {
    if (isModalMounted) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, isModalMounted]);

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

        console.log('Fetched profile:', profile); // Debugging log

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

  // Fetch rooms
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

  // Subscribe to new messages in the active room
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

  // Fetch messages for the active room
  const fetchMessages = useCallback(async () => {
    if (!activeRoom) return;

    const { data, error } = await supabase
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

    console.log('Fetched messages:', data); // Debugging log

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

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

  // Fetch messages when the active room changes
  useEffect(() => {
    if (activeRoom) {
      fetchMessages();
    }
  }, [activeRoom, fetchMessages]);

  // Handle sending a new message
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
  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: newContent })
        .eq('id', messageId);
  
      if (error) throw error;
      
      setEditingMessageId(null);
      setEditedContent('');
      await fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
  
      if (error) throw error;
      await fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error deleting message:', error);
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
        <div className="fixed inset-0 scrollbar-custom bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                            : 'text-zinc-300 hover:bg-zinc700/50'
                        }`}
                      >
                        {activeTab === 'public' ? (
                          <Hash className="w-4 h-4 text-zinc500" />
                        ) : (
                          <Lock className="w-4 h=4 text-zinc500" />
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
                    <div className="flex-grow overflow-y-auto opacity-90 blur p-4 space-y-4" ref={messagesContainerRef}>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`group flex items-start gap-4 p-4 ${
                            message.user_id === user.id ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <Image
                              src={message.user.avatar_url}
                              alt={message.user.nickname}
                              width={40}
                              height={40}
                              className="rounded-full border-2 border-zinc-700"
                            />
                          </div>
                          <div
                            className={`flex flex-col max-w-[70%] ${
                              message.user_id === user.id ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div className={`flex items-center gap-2 mb-1 ${
                              message.user_id === user.id ? 'flex-row-reverse' : ''
                            }`}>
                              <span className="font-medium text-zinc-100 text-sm">
                                {message.user.nickname}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="relative">
                              {editingMessageId === message.id ? (
                                <form 
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleEditMessage(message.id, editedContent);
                                  }}
                                  className="flex gap-2"
                                >
                                  <input
                                    type="text"
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="bg-zinc-800 text-white px-3 py-1.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500 text-sm"
                                    autoFocus
                                  />
                                  <button
                                    type="submit"
                                    className="text-blue-500 hover:text-blue-400 text-sm"
                                  >
                                    Sauvegarder
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingMessageId(null);
                                      setEditedContent('');
                                    }}
                                    className="text-zinc-500 hover:text-zinc-400 text-sm"
                                  >
                                    Annuler
                                  </button>
                                </form>
                              ) : (
                                <>
                                  <div
                                className={`rounded-lg py-2 px-4 ${
                                  message.user_id === user.id
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-zinc-800 text-zinc-100 rounded-tl-none'
                                } max-w-[400px]`}
                              >
                                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                  {message.content.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                      {line}
                                      {i !== message.content.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                  ))}
                                </p>
                              </div>
                                  {message.user_id === user.id && (
                                    <div className={`absolute top-0 ${message.user_id === user.id ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex gap-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                      <button
                                        onClick={() => {
                                          setEditingMessageId(message.id);
                                          setEditedContent(message.content);
                                        }}
                                        className="text-zinc-400 hover:text-zinc-200"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="text-zinc-400 hover:text-red-400"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <form
                      onSubmit={handleSendMessage}
                      className="p-4 bg-zinc-800/30 border-t border-zinc-700/50"
                    >
                      <div className="flex items-center gap-x-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-grow bg-zinc-800 text-white px-4 py-2.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-zinc-500"
                          placeholder="Écrivez votre message..."
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className={`bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700`}
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-grow flex items-center justify-center">
                    <p className="text-zinc500">Sélectionnez un salon pour commencer à discuter</p>
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
