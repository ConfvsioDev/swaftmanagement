// src/components/Dashboard.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { 
  CalendarIcon, 
  ChatBubbleLeftRightIcon, 
  ClipboardDocumentListIcon, 
  RectangleStackIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import NicknameModal from './NicknameModal'

interface User {
  id: string;
  email?: string;
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
  };
  nickname?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

useEffect(() => {
  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname, avatar_url') // Ensure you're selecting both nickname and avatar_url
        .eq('id', user.id)
        .single();

      setUser({ 
        ...user, 
        nickname: profile?.nickname,
        user_metadata: {
          avatar_url: profile?.avatar_url || user.user_metadata.avatar_url || '', // Use profile avatar if available
          full_name: user.user_metadata.full_name,
        }
      });
      } else {
        router.push('/login')
      }
      setLoading(false)
    }

    getUser()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const quickStats = [
    { title: "Projets", value: "12", icon: <RectangleStackIcon className="h-6 w-6" />, color: "from-purple-600 to-indigo-700" },
    { title: "Tâches", value: "28", icon: <ClipboardDocumentListIcon className="h-6 w-6" />, color: "from-green-500 to-emerald-700" },
    { title: "Messages", value: "5", icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />, color: "from-pink-500 to-rose-700" },
  ]

  const performanceData = [
    { day: 'Lun', value: 60 },
    { day: 'Mar', value: 80 },
    { day: 'Mer', value: 40 },
    { day: 'Jeu', value: 70 },
    { day: 'Ven', value: 90 },
  ]

  const calendarEvents = [
    { id: 1, date: '15 Jan', time: '14:00', event: 'Réunion client' },
    { id: 2, date: '17 Jan', time: '10:00', event: 'Présentation' },
    { id: 3, date: '20 Jan', time: '15:30', event: 'Revue projet' },
  ]

  const teamMembers = [
    { id: 1, name: 'Sophie M.', role: 'Designer', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: 2, name: 'Thomas D.', role: 'Dev', avatar: 'https://randomuser.me/api/portraits/men/86.jpg' },
    { id: 3, name: 'Emma L.', role: 'PM', avatar: 'https://randomuser.me/api/portraits/women/24.jpg' },
  ]

  return (
    <div className="flex-grow p-[20px] bg-gray-900 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
        {/* Quick Stats */}
        <div className="col-span-full md:grid md:grid-cols-3 md:grid-flow-row gap-[20px]">
          {quickStats.map((stat, index) => (
            <QuickStat key={index} {...stat} />
          ))}
        </div>

        {/* Performance Chart */}
        <div className="bg-gray-800 rounded-lg p-[20px] shadow-md">
          <h2 className="font-semibold text-white mb-[10px] flex items-center">
            <ChartBarIcon className="h-[24px] w-[24px] mr-[5px]" /> Performance
          </h2>
          <div className="flex items-end justify-between h-[100px]">
            {performanceData.map((item) => (
              <div key={item.day} className="w-full bg-blue-500 rounded-t" style={{ height: `${item.value}%` }}></div>
            ))}
          </div>
          <div className="flex justify-between mt-[5px] text-gray-400">
            {performanceData.map((item) => (
              <span key={item.day}>{item.day}</span>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-gray-800 rounded-lg p-[20px] shadow-md col-span-full md:w-full lg:w-auto">
          <h2 className="font-semibold text-white mb-[10px] flex items-center">
            <CalendarIcon className="h-[24px] w-[24px] mr-[5px]" /> Calendrier
          </h2>
          <ul className="space-y-[10px]">
            {calendarEvents.map((item) => (
              <li key={item.id} className="text-gray-300 flex justify-between">
                <span>{item.date}</span>
                <span>{item.time}</span>
                <span className="text-gray-400">{item.event}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Team Members */}
        <div className="bg-gray-800 rounded-lg p-[20px] shadow-md col-span-full md:w-full lg:w-auto">
          <h2 className="font-semibold text-white mb-[10px] flex items-center">
            <UserGroupIcon className="h-[24px] w-[24px] mr-[5px]" /> Équipe
          </h2>
          <ul className="space-y-[10px]">
            {teamMembers.map((member) => (
              <li key={member.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <img src={member.avatar} alt={member.name} className="w-[30px] h-[30px] rounded-full mr-[10px]" />
                  <span className="text-gray-300">{member.name}</span>
                </div>
                <span className="text-gray-400">{member.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Nickname Modal */}
      {showNicknameModal && (
        <NicknameModal 
          onClose={() => setShowNicknameModal(false)} 
          onNicknameSet={(nickname) => setUser(prev => ({ ...prev!, nickname }))} 
        />
      )}
    
    </div>
  )
}

function QuickStat({ title, value, icon, color }: { title:string; value:string; icon:any; color:string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-[10px] flex flex-col justify-between`}>
      <div className="flex justify-between items-center mb-[5px]">
        <h2 className="font-semibold text-white">{title}</h2>
        {icon}
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  )
}
