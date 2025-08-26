'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, User, FileText, AlertCircle, CheckCircle, XCircle, Edit, Plus } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface Activity {
  id: string
  type: string
  description: string
  userId: string
  user: {
    name: string
    email: string
  }
  bookingId?: string
  booking?: {
    eventTitle: string
    client: {
      name: string
    }
  }
  clientId?: string
  client?: {
    name: string
    email: string
  }
  metadata?: any
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const activityTypes = [
  { value: 'BOOKING_CREATED', label: 'Locação Criada', icon: FileText, color: 'text-green-600' },
  { value: 'BOOKING_UPDATED', label: 'Locação Atualizada', icon: Edit, color: 'text-blue-600' },
  { value: 'BOOKING_CANCELLED', label: 'Locação Cancelada', icon: XCircle, color: 'text-red-600' },
  { value: 'CLIENT_CREATED', label: 'Cliente Cadastrado', icon: User, color: 'text-purple-600' },
  { value: 'CLIENT_UPDATED', label: 'Cliente Atualizado', icon: Edit, color: 'text-blue-600' },
  { value: 'CONTRACT_DOWNLOADED', label: 'Contrato Baixado', icon: FileText, color: 'text-green-600' },
  { value: 'REMINDER_CREATED', label: 'Lembrete Criado', icon: AlertCircle, color: 'text-yellow-600' },
  { value: 'REMINDER_COMPLETED', label: 'Lembrete Concluído', icon: CheckCircle, color: 'text-green-600' },
  { value: 'REMINDER_DELETED', label: 'Lembrete Excluído', icon: XCircle, color: 'text-red-600' },
  { value: 'PRODUCT_CREATED', label: 'Produto Criado', icon: Plus, color: 'text-green-600' },
  { value: 'PRODUCT_UPDATED', label: 'Produto Atualizado', icon: Edit, color: 'text-blue-600' },
  { value: 'ACCESSORY_CREATED', label: 'Acessório Criado', icon: Plus, color: 'text-green-600' },
  { value: 'ACCESSORY_UPDATED', label: 'Acessório Atualizado', icon: Edit, color: 'text-blue-600' }
]

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  
  const { showToast } = useToast()

  useEffect(() => {
    loadActivities()
  }, [pagination.page, filters])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (filters.type) params.append('type', filters.type)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      
      const response = await fetch(`/api/activities?${params}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
        setPagination(data.pagination)
      } else {
        showToast({
          type: 'error',
          title: 'Erro ao carregar',
          message: 'Não foi possível carregar as atividades.'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar atividades:', error)
      showToast({
        type: 'error',
        title: 'Erro ao carregar',
        message: 'Erro ao carregar atividades.'
      })
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    const activityType = activityTypes.find(at => at.value === type)
    if (activityType) {
      const Icon = activityType.icon
      return <Icon className={`w-5 h-5 ${activityType.color}`} />
    }
    return <FileText className="w-5 h-5 text-gray-600" />
  }

  const getActivityLabel = (type: string) => {
    const activityType = activityTypes.find(at => at.value === type)
    return activityType ? activityType.label : type
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const clearFilters = () => {
    setFilters({ type: '', startDate: '', endDate: '' })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">📊</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Atividades Recentes</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Bem-vindo, {user?.email}</span>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Voltar ao Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Acompanhe todas as atividades do sistema</h2>
          <p className="text-gray-600 mt-2">Histórico completo de ações e eventos</p>
        </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? 'Ocultar' : 'Mostrar'} Filtros</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Atividade</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os tipos</option>
                {activityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-700 text-sm"
          >
            Limpar Filtros
          </button>
          <div className="text-sm text-gray-600">
            {pagination.total} atividades encontradas
          </div>
        </div>
      </div>

      {/* Lista de Atividades */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando atividades...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sem atividades recentes</h3>
            <p className="text-gray-600">Não há atividades para exibir com os filtros selecionados.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atividade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalhes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {getActivityIcon(activity.type)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getActivityLabel(activity.type)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {activity.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{activity.user.name}</div>
                        <div className="text-sm text-gray-500">{activity.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(activity.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.booking && (
                          <div>
                            <div className="font-medium">{activity.booking.eventTitle}</div>
                            <div>Cliente: {activity.booking.client.name}</div>
                          </div>
                        )}
                        {activity.client && (
                          <div>
                            <div className="font-medium">{activity.client.name}</div>
                            <div>{activity.client.email}</div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span> de{' '}
                      <span className="font-medium">{pagination.total}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const page = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i
                        if (page > pagination.pages) return null
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                              page === pagination.page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            } border`}
                          >
                            {page}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próxima
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
