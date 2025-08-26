'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 py-4">
          <Link 
            href="/dashboard" 
            className={`pb-2 font-medium transition-colors ${
              isActive('/dashboard') 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            href="/dashboard/products" 
            className={`pb-2 font-medium transition-colors ${
              isActive('/dashboard/products') 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Inventário
          </Link>
          <Link 
            href="/dashboard/clients" 
            className={`pb-2 font-medium transition-colors ${
              isActive('/dashboard/clients') 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Clientes
          </Link>
          <Link 
            href="/dashboard/bookings" 
            className={`pb-2 font-medium transition-colors ${
              isActive('/dashboard/bookings') 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Locações
          </Link>
          <Link 
            href="/dashboard/verificar-disponibilidade" 
            className={`pb-2 font-medium transition-colors ${
              isActive('/dashboard/verificar-disponibilidade') 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Verificar Disponibilidade
          </Link>
          <Link 
            href="/dashboard/configuracoes" 
            className={`pb-2 font-medium transition-colors ${
              isActive('/dashboard/configuracoes') 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Configurações
          </Link>
        </div>
      </div>
    </nav>
  )
}
