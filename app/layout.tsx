import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Panini Copa 2026',
  description: 'Gerencie e troque suas figurinhas da Copa do Mundo 2026',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
