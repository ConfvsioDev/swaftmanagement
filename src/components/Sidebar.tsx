// src/components/Sidebar.tsx
'use client'

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  Calendar,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

const sidebarItems = [
  { icon: Home, label: 'Accueil', href: '/' },
  { icon: Calendar, label: 'Calendrier', href: '/calendar' },
  { icon: Users, label: 'Équipe', href: '/team' },
  { icon: Settings, label: 'Paramètres', href: '/settings' },
];

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<{
      avatar_url?: string;
      nickname?: string;
      email?: string;
      user_metadata?: {
        full_name?: string;
        avatar_url?: string;
      };
    } | null>(null);
    const [loading, setLoading] = useState(true);
    
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClientComponentClient();
  
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
            nickname: profile?.nickname,
            user_metadata: {
              avatar_url: profile?.avatar_url || user.user_metadata.avatar_url,
              full_name: user.user_metadata.full_name,
            },
          });
        }
        setLoading(false);
      };
  
      fetchUserData();
    }, [supabase]);
  
    const handleLogout = async () => {
      try {
        await supabase.auth.signOut();
        router.push('/login'); // Redirect to login page after logout
      } catch (error) {
        console.error('Error logging out:', error);
      }
    };
  if (loading) {
    return <div></div>; // Or a more sophisticated loading indicator
  }

  return (
    <aside className={cn(
        "fixed left-0 top-0 h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 border-r border-zinc-800/40 pt-16 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
      <div className="px-4 py-4 flex items-center justify-between">
        <h1 className={cn(
          "font-bold text-zinc-100 transition-all duration-300 ",
          collapsed ? "text-center text-xl" : "text-2xl "
        )}>
          {collapsed ? "" : "Swaft"}
        </h1>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors duration-200"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <nav className="space-y-1.5 py-4">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-zinc-800/60 text-zinc-100 hover:bg-zinc-800"
                    : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-zinc-800/40 p-4">
        <div className={cn(
          "flex items-center gap-x-3",
          collapsed && "justify-center"
        )}>
          <Image
            src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
            alt="User avatar"
            width={36}
            height={36}
            className="rounded-full border border-zinc-800/40"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-100">
                {user?.nickname || user?.user_metadata?.full_name || 'User'}
              </span>
              <span className="text-xs text-zinc-400 truncate max-w-[160px]">
                {user?.email}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            "mt-4 flex items-center gap-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full",
            "text-red-400 hover:bg-red-500/10 hover:text-red-300",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
