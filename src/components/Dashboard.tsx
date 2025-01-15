// Dashboard.tsx
'use client'
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  LayoutGrid,
  CheckSquare,
  MessageSquare,
  Users,
  TrendingUp,
  Calendar,
  Bell,
  Clock
} from 'lucide-react';
import NicknameModal from './NicknameModal';
import Image from 'next/image';

interface User {
  id: string;
  email?: string;
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
  };
  nickname?: string;
}

interface Activity {
  id: number;
  title: string;
  time: string;
  type: 'task' | 'meeting' | 'update';
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
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
            avatar_url: profile?.avatar_url || user.user_metadata.avatar_url || '',
            full_name: user.user_metadata.full_name,
          }
        });

        if (!profile?.nickname) {
          setShowNicknameModal(true);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    };

    getUser();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!user) return null;

  const quickStats = [
    { title: "Projets Actifs", value: "99", icon: LayoutGrid, color: "from-violet-600 to-violet-800" },
    { title: "Tâches", value: "99", icon: CheckSquare, color: "from-emerald-600 to-emerald-800" },
    { title: "Messages", value: "99", icon: MessageSquare, color: "from-blue-600 to-blue-800" },
    { title: "JSP", value: "", icon: MessageSquare, color: "from-amber-600 to-amber-800" },
  ];

  const teamMembers = [
    { id: 1, name: 'Clarel', role: 'Développeur', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 2, name: 'Ylian', role: 'Sert a rien', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
    { id: 3, name: 'Nathan', role: 'Designer UI/UX', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' },
    { id: 4, name: 'Theophile', role: 'Sert a rien v2', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' },
  ];

  const recentActivities: Activity[] = [
    { id: 1, title: 'Réunion équipe', time: '14:00', type: 'meeting' },
    { id: 2, title: 'Mise à jour', time: '11:30', type: 'update' },
    { id: 3, title: 'Review code', time: '09:15', type: 'task' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Tableau de Bord</h1>
          <p className="text-zinc-400">Bienvenue, {user.nickname || user.user_metadata.full_name}</p>
        </div>
        <div className="flex items-center">
          <button className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors">
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 text-white shadow-lg`}
          >
            <div className="flex justify-between items-center mb-4">
              <stat.icon className="h-6 w-6 opacity-80" />
              <span className="text-2xl font-bold">{stat.value}</span>
            </div>
            <h3 className="text-sm font-medium opacity-90">{stat.title}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Section */}
        <div className="lg:col-span-2 bg-zinc-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Équipe
            </h2>
            <button className="text-zinc-400 hover:text-zinc-100 text-sm">Voir tout</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-zinc-800 rounded-lg p-4 flex flex-col items-center text-center">
                <Image
                  src={member.avatar}
                  alt={member.name}
                  width={64}
                  height={64}
                  className="rounded-full mb-3"
                />
                <h3 className="text-zinc-100 font-medium">{member.name}</h3>
                <p className="text-zinc-400 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activities Section */}
        <div className="bg-zinc-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activités Récentes
            </h2>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-zinc-800">
                <div className="flex-shrink-0">
                  {activity.type === 'meeting' && <Calendar className="h-5 w-5 text-blue-500" />}
                  {activity.type === 'update' && <TrendingUp className="h-5 w-5 text-green-500" />}
                  {activity.type === 'task' && <CheckSquare className="h-5 w-5 text-amber-500" />}
                </div>
                <div className="flex-grow">
                  <h4 className="text-zinc-100 text-sm">{activity.title}</h4>
                  <p className="text-zinc-400 text-xs">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showNicknameModal && (
        <NicknameModal
          onClose={() => setShowNicknameModal(false)}
          onNicknameSet={(nickname) => setUser(prev => ({ ...prev!, nickname }))}
        />
      )}
    </div>
  );
}
