'use client'

import React, { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export default function NicknameModal({
  onClose,
  onNicknameSet,
}: {
  onClose: () => void
  onNicknameSet: (nickname: string) => void
}) {
  const [nickname, setNickname] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          nickname: nickname,
          avatar_url: user.user_metadata.avatar_url || null
        })
    
        if (error) throw error
        
        onNicknameSet(nickname)
        onClose()
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du pseudo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-xl border border-zinc-800/50 shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
            <h2 className="text-xl font-semibold text-zinc-100">
              Choisir un pseudo
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="nickname"
                className="text-sm font-medium text-zinc-400"
              >
                Pseudo
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg text-sm",
                  "bg-zinc-900/50 border border-zinc-800",
                  "text-zinc-100 placeholder:text-zinc-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50",
                  "transition duration-200"
                )}
                placeholder="Entrez votre pseudo"
                required
                minLength={3}
                maxLength={30}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
                  "bg-zinc-800/50 hover:bg-zinc-800",
                  "text-zinc-300 hover:text-zinc-100",
                  "border border-zinc-700/50",
                  "transition duration-200",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
                  "bg-blue-500/10 hover:bg-blue-500/20",
                  "text-blue-400 hover:text-blue-300",
                  "border border-blue-500/20 hover:border-blue-500/30",
                  "transition duration-200",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
                disabled={isLoading}
              >
                {isLoading ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}