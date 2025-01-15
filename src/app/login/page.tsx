// src/app/login/page.tsx
import AuthComponent from '@/components/Auth'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-zinc-900">
      <div className="flex-1 flex items-center justify-center">
        <AuthComponent />
      </div>
    </div>
  )
}