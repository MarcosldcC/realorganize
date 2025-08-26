import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Gestão de Locações LED',
  description: 'Sistema de gestão de locações de painéis de LED',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}