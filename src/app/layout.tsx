import Sidebar from '@/components/Sidebar';
import './globals.css';

export const metadata = {
  title: "Gestion Swaft",
  description: "Outils de Gestion de Swaft",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="flex h-screen bg-zinc-900 text-gray-200 overflow-hidden">
        <Sidebar />
        <div className="flex-grow flex flex-col">
          <main className="flex-grow">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}