// src/components/Sidebar.tsx
'use client'
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { HomeIcon, ChartBarIcon, CalendarIcon, UserGroupIcon, CogIcon } from '@heroicons/react/24/outline';

const Sidebar = () => {
  const [user, setUser] = useState<{
    avatar_url?: string;
    nickname?: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string; // Ensure this is included
    };
  } | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch additional profile data if needed
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
    };

    fetchUserData();
  }, [supabase]);

  return (
    <aside className="w-[250px] bg-gray-800 text-white h-full shadow-lg flex flex-col">
      <div className="p-[20px]">
        <h1 className="text-xl font-bold">Mon Application</h1>
      </div>
      <nav>
        <ul>
          {[{icon: HomeIcon, label: "Accueil"}, {icon: ChartBarIcon, label: "Tableau de Bord"}, {icon: CalendarIcon, label: "Calendrier"}, {icon: UserGroupIcon, label: "Équipe"}, {icon: CogIcon, label: "Paramètres"}].map((item) => (
            <li key={item.label} className={`flex items-center p-[15px] hover:bg-gray-700 cursor-pointer transition duration-[200ms]`}>
              {React.createElement(item.icon, {className:"h-[20px] w-[20px] mr-[10px]"})}
              {item.label}
            </li>))}
        </ul>
      </nav>
      {/* User Info */}
      <footer className="mt-auto flex items-center space-x-[10px] p-[10px] bg-gray-800 rounded-lg shadow-md">
        <img 
          src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
          alt="User avatar" 
          className="w-[30px] h-[30px] rounded-full"
        />
        <span className="text-white text-sm">{user?.nickname || user?.user_metadata?.full_name || user?.email}</span>
      </footer>
    </aside>
  );
};

export default Sidebar;
