import AuthComponent from '@/components/Auth'

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Connexion avec Discord</h1>
      <AuthComponent />
    </div>
  )
}
