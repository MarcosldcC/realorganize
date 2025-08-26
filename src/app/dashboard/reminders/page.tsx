'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, CheckCircle, Clock, AlertCircle, Calendar, User, FileText } from 'lucide-react'

interface Reminder {
  id: string
  title: string
  description?: string
  dueDate: string
  isCompleted: boolean
  isRecurring: boolean
  recurrence?: string
  userId: string
  user: {
    name: string
    email: string
  }
  bookingId?: string
  booking?: {
    eventTitle: string
    startDate: string
    endDate: string
  }
  clientId?: string
  client?: {
    name: string
    email: string
  }
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    isRecurring: false,
    recurrence: '',
    bookingId: '',
    clientId: ''
  })
  const [bookings, setBookings] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    loadReminders()
    loadBookings()
    loadClients()
  }, [pagination.page])

  const loadReminders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reminders?page=${pagination.page}&limit=${pagination.limit}`)
      if (response.ok) {
        const data = await response.json()
        setReminders(data.reminders)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBookings = async () => {
    try {
      const response = await fetch('/api/bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Erro ao carregar locações:', error)
    }
  }

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.dueDate) {
      alert('Por favor, preencha o título e a data de vencimento')
      return
    }

    try {
      const url = editingReminder ? `/api/reminders/${editingReminder.id}` : '/api/reminders'
      const method = editingReminder ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowForm(false)
        setEditingReminder(null)
        setFormData({
          title: '',
          description: '',
          dueDate: '',
          isRecurring: false,
          recurrence: '',
          bookingId: '',
          clientId: ''
        })
        loadReminders()
        alert(editingReminder ? 'Lembrete atualizado com sucesso!' : 'Lembrete criado com sucesso!')
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao salvar lembrete:', error)
      alert('Erro ao salvar lembrete')
    }
  }

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      dueDate: new Date(reminder.dueDate).toISOString().split('T')[0],
      isRecurring: reminder.isRecurring,
      recurrence: reminder.recurrence || '',
      bookingId: reminder.bookingId || '',
      clientId: reminder.clientId || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (reminderId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lembrete?')) return
    
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, { method: 'DELETE' })
      if (response.ok) {
        loadReminders()
        alert('Lembrete excluído com sucesso!')
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao excluir lembrete:', error)
      alert('Erro ao excluir lembrete')
    }
  }

  const toggleComplete = async (reminderId: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !isCompleted })
      })

      if (response.ok) {
        loadReminders()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro ao atualizar lembrete:', error)
      alert('Erro ao atualizar lembrete')
    }
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

  const getDaysUntil = (dateString: string) => {
    const dueDate = new Date(dateString)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (reminder: Reminder) => {
    if (reminder.isCompleted) return 'bg-green-100 text-green-800'
    
    const daysUntil = getDaysUntil(reminder.dueDate)
    if (daysUntil < 0) return 'bg-red-100 text-red-800'
    if (daysUntil <= 1) return 'bg-yellow-100 text-yellow-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getStatusText = (reminder: Reminder) => {
    if (reminder.isCompleted) return 'Concluído'
    
    const daysUntil = getDaysUntil(reminder.dueDate)
    if (daysUntil < 0) return 'Atrasado'
    if (daysUntil === 0) return 'Vence hoje'
    if (daysUntil === 1) return 'Vence amanhã'
    return `Vence em ${daysUntil} dias`
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
                <span className="text-white text-xl font-bold">🔔</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Lembretes</h1>
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
          <h2 className="text-2xl font-bold text-gray-900">Gerencie seus lembretes e tarefas</h2>
          <p className="text-gray-600 mt-2">Organize e acompanhe suas atividades importantes</p>
        </div>

      {/* Botão Novo Lembrete */}
      <div className="mb-6">
        <button
          onClick={() => {
            setShowForm(true)
            setEditingReminder(null)
            setFormData({
              title: '',
              description: '',
              dueDate: '',
              isRecurring: false,
              recurrence: '',
              bookingId: '',
              clientId: ''
            })
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Lembrete</span>
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingReminder ? 'Editar Lembrete' : 'Novo Lembrete'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento *</label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locação</label>
                <select
                  value={formData.bookingId}
                  onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma locação</option>
                  {bookings.map(booking => (
                    <option key={booking.id} value={booking.id}>
                      {booking.eventTitle}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recorrência</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Recorrente</span>
                </div>
                {formData.isRecurring && (
                  <select
                    value={formData.recurrence}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione a recorrência</option>
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingReminder(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingReminder ? 'Atualizar' : 'Criar'} Lembrete
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Lembretes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando lembretes...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lembrete encontrado</h3>
            <p className="text-gray-600">Crie seu primeiro lembrete para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relacionado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reminders.map((reminder) => (
                  <tr key={reminder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={reminder.isCompleted}
                          onChange={() => toggleComplete(reminder.id, reminder.isCompleted)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reminder)}`}>
                          {getStatusText(reminder)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{reminder.title}</div>
                        {reminder.description && (
                          <div className="text-sm text-gray-500">{reminder.description}</div>
                        )}
                        {reminder.isRecurring && reminder.recurrence && (
                          <div className="text-xs text-blue-600">
                            {reminder.recurrence === 'daily' ? 'Diário' : 
                             reminder.recurrence === 'weekly' ? 'Semanal' : 
                             reminder.recurrence === 'monthly' ? 'Mensal' : ''}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(reminder.dueDate)}</div>
                      <div className="text-sm text-gray-500">
                        {getDaysUntil(reminder.dueDate) >= 0 ? 
                          `${getDaysUntil(reminder.dueDate)} dias restantes` : 
                          `${Math.abs(getDaysUntil(reminder.dueDate))} dias de atraso`
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reminder.booking && (
                        <div>
                          <div className="font-medium">{reminder.booking.eventTitle}</div>
                          <div>Evento</div>
                        </div>
                      )}
                      {reminder.client && (
                        <div>
                          <div className="font-medium">{reminder.client.name}</div>
                          <div>Cliente</div>
                        </div>
                      )}
                      {!reminder.booking && !reminder.client && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(reminder)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(reminder.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação */}
      {pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
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
                      onClick={() => setPagination(prev => ({ ...prev, page }))}
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
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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
    </div>
  )
}
