'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import Link from 'next/link'
import Navbar from '@/components/Navbar'

interface DashboardKPIs {
  totalBookings: number
  futureBookings: number
  confirmedBookings: number
  holdBookings: number
  totalRevenue: number
  receivedAmount: number
  pendingAmount: number
  overdueAmount: number
  totalProducts: number
  totalProductMeters: number
  totalClients: number
  totalEquipment: number
  totalEquipmentQty: number
}

interface CompanySettings {
  name: string
  email: string
  phone: string
  address: string
  cnpj: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalBookings: 0,
    futureBookings: 0,
    confirmedBookings: 0,
    holdBookings: 0,
    totalRevenue: 0,
    receivedAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    totalProducts: 0,
    totalProductMeters: 0,
    totalClients: 0,
    totalEquipment: 0,
    totalEquipmentQty: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadCompanySettings()
    loadKPIs()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }
      const userData = await response.json()
      setUser(userData.user)
    } catch (error) {
      console.error('Erro na autenticação:', error)
      router.push('/login')
    }
  }

  const loadCompanySettings = async () => {
    try {
      const response = await fetch('/api/company-settings')
      if (response.ok) {
        const data = await response.json()
        setCompanySettings(data)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da empresa:', error)
    }
  }

  const loadKPIs = async () => {
    try {
      setError(null)
      const response = await fetch('/api/dashboard/kpis')
      if (response.ok) {
        const data = await response.json()
        setKpis(data)
      } else {
        const errorData = await response.json()
        setError(`Erro ao carregar KPIs: ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error)
      setError('Erro de conexão ao carregar KPIs')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Erro no logout:', error)
      router.push('/login')
    }
  }

  const handleRefreshKPIs = () => {
    setLoading(true)
    loadKPIs()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">📊</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {companySettings?.name || 'Sua Empresa'} Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Bem-vindo, {user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span>🚪</span>
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">❌</span>
                <span className="text-red-800">{error}</span>
              </div>
              <button
                onClick={handleRefreshKPIs}
                className="text-red-600 hover:text-red-800 text-sm underline"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* KPIs Principais - 4 Cards Organizados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Locações Futuras */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Locações Futuras</p>
                <p className="text-3xl font-bold text-green-600">{kpis.futureBookings}</p>
                <p className="text-sm text-gray-500">Próximos eventos</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-green-600 text-2xl">📅</span>
              </div>
            </div>
          </div>

          {/* Receita Pendente */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Pendente</p>
                <p className="text-3xl font-bold text-yellow-600">R$ {kpis.pendingAmount.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Aguardando pagamento</p>
              </div>
              <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-yellow-600 text-2xl">⏰</span>
              </div>
            </div>
          </div>

          {/* Total de Clientes */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                <p className="text-3xl font-bold text-blue-600">{kpis.totalClients}</p>
                <p className="text-sm text-gray-500">Clientes cadastrados</p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 text-2xl">👥</span>
              </div>
            </div>
          </div>

          {/* Receita Total */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-3xl font-bold text-purple-600">R$ {kpis.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Faturamento geral</p>
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-purple-600 text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">📦</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Produtos & Acessórios</h3>
            </div>
            <p className="text-gray-600 mb-4">Gerencie seus painéis de LED e acessórios</p>
            <Link 
              href="/dashboard/products" 
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>Ver Produtos & Acessórios</span>
              <span>👁️</span>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Clientes</h3>
            </div>
            <p className="text-gray-600 mb-4">Cadastre e gerencie seus clientes</p>
            <Link 
              href="/dashboard/clients" 
              className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium"
            >
              <span>Ver Clientes</span>
              <span>👁️</span>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-lg">📅</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Nova Locação</h3>
            </div>
            <p className="text-gray-600 mb-4">Crie uma nova locação para seus clientes</p>
            <Link 
              href="/dashboard/bookings" 
              className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              <span>Criar Locação</span>
              <span>➕</span>
            </Link>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center">
          <button
            onClick={handleRefreshKPIs}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <span>🔄</span>
            <span>{loading ? 'Atualizando...' : 'Atualizar Dashboard'}</span>
          </button>
        </div>
      </main>
    </div>
  )
}
