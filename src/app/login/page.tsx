// src/app/login/page.tsx
import AuthComponent from '@/components/Auth'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-zinc-900">
      <div className="flex-1 flex items-center justify-center">
        <AuthComponent />
      </div>
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/login-image.jpg" // Make sure to add an appropriate image
          alt="Login background"
          layout="fill"
          objectFit="cover"
          className="rounded-l-3xl"
        />
        <div className="absolute inset-0 bg-black opacity-50 rounded-l-3xl"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-4">Swaft</h1>
            <p className="text-xl text-zinc-200">Gérez vos projets efficacement</p>
          </div>
        </div>
      </div>
    </div>
  )
}