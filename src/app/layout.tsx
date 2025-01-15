// src/app/layout.tsx

import './globals.css';
import ClientLayout from './ClientLayout';
import ChatIcon from '../components/ChatIcon';

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
      <body className="bg-zinc-900 text-gray-200">
        <ClientLayout>{children}</ClientLayout>
        <ChatIcon />
      </body>
    </html>
  );
}
