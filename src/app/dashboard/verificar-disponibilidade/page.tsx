'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Settings, Wrench, CheckCircle, XCircle, AlertCircle, Calendar, Clock, ArrowLeft, Building, Gauge, Trash2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useToast } from '@/components/Toast'

interface Product {
  id: string
  name: string
  code: string
  totalMeters: number
  pricePerMeter: number
  occupiedMeters: number
  availableMeters: number
  utilizationPercent: number
  status: 'DISPONÍVEL' | 'INDISPONÍVEL'
}

interface Accessory {
  id: string
  name: string
  code: string
  totalQty: number
  pricePerUnit: number
  occupiedQty: number
  availableQty: number
  utilizationPercent: number
  status: 'DISPONÍVEL' | 'INDISPONÍVEL'
}

interface Equipment {
  id: string
  name: string
  code: string
  totalQty: number
  pricePerUnit: number
  occupiedQty: number
  availableQty: number
  utilizationPercent: number
  status: 'DISPONÍVEL' | 'INDISPONÍVEL'
}

interface SystemAvailability {
  currentAvailability: {
    products: Product[]
    accessories: Accessory[]
    equipment: Equipment[]
  }
  summary: {
    totalProducts: number
    totalAccessories: number
    totalEquipment: number
    totalProductMeters: number
    totalAccessoryQty: number
    totalEquipmentQty: number
    occupiedProductMeters: number
    occupiedAccessoryQty: number
    occupiedEquipmentQty: number
    availableProductMeters: number
    availableAccessoryQty: number
    availableEquipmentQty: number
    lastUpdated: string
  }
  activeBookings: number
}

interface SelectedItem {
  type: 'PRODUTO' | 'ACESSÓRIO' | 'EQUIPAMENTO'
  id: string
  name: string
  code: string
  quantity: number
  unit: string
  maxAvailable: number
}

interface AvailabilityResult {
  id: string
  name: string
  code: string
  type: 'PRODUTO' | 'ACESSÓRIO' | 'EQUIPAMENTO'
  requestedQuantity: number
  availableQuantity: number
  totalQuantity: number
  occupiedQuantity: number
  unit: string
  status: 'DISPONÍVEL' | 'INDISPONÍVEL'
  reason?: string
  occupyingBookings: Array<{
    bookingId: string
    eventTitle: string
    clientName: string
    startDate: string
    endDate: string
    occupiedQuantity: number
    status: string
  }>
}

interface AvailabilityResponse {
  success: boolean
  available: boolean
  results: AvailabilityResult[]
  summary: {
    totalItems: number
    availableItems: number
    unavailableItems: number
    generalStatus: 'TOTALMENTE_DISPONIVEL' | 'PARCIALMENTE_DISPONIVEL'
  }
  period: {
    startDate: string
    endDate: string
  }
  message: string
  recommendation: string
}

export default function VerificarDisponibilidadePage() {
  const [systemAvailability, setSystemAvailability] = useState<SystemAvailability | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [availabilityResults, setAvailabilityResults] = useState<AvailabilityResponse | null>(null)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  const { showToast } = useToast()

  useEffect(() => {
    loadSystemAvailability()
  }, [])

  const loadSystemAvailability = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/availability')
      if (response.ok) {
        const data = await response.json()
        setSystemAvailability(data)
      } else {
        showToast({
          type: 'error',
          title: 'Erro ao carregar',
          message: 'Erro ao carregar dados de disponibilidade do sistema.'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar disponibilidade:', error)
      showToast({
        type: 'error',
        title: 'Erro ao carregar',
        message: 'Erro ao carregar dados de disponibilidade do sistema.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleItemSelection = (type: 'PRODUTO' | 'ACESSÓRIO' | 'EQUIPAMENTO', item: any, checked: boolean) => {
    if (checked) {
      const newItem: SelectedItem = {
        type,
        id: item.id,
        name: item.name,
        code: item.code,
        quantity: 1,
        unit: type === 'PRODUTO' ? 'metros' : 'unidades',
        maxAvailable: type === 'PRODUTO' ? item.availableMeters : item.availableQty
      }
      setSelectedItems(prev => [...prev, newItem])
    } else {
      setSelectedItems(prev => prev.filter(selectedItem => !(selectedItem.id === item.id && selectedItem.type === type)))
    }
  }

  const updateItemQuantity = (itemId: string, itemType: string, newQuantity: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.id === itemId && item.type === itemType) {
        return { ...item, quantity: Math.max(1, newQuantity) }
      }
      return item
    }))
  }

  const removeSelectedItem = (itemId: string, itemType: string) => {
    setSelectedItems(prev => prev.filter(item => !(item.id === itemId && item.type === itemType)))
  }

  const checkAvailability = async () => {
    if (!startDate || !endDate || selectedItems.length === 0) {
      showToast({
        type: 'error',
        title: 'Dados incompletos',
        message: 'Preencha todas as datas e selecione pelo menos um item.'
      })
      return
    }

    // Validar quantidades
    const invalidItems = selectedItems.filter(item => item.quantity <= 0)
    if (invalidItems.length > 0) {
      showToast({
        type: 'error',
        title: 'Quantidades inválidas',
        message: 'Todas as quantidades devem ser maiores que zero.'
      })
      return
    }

    try {
      setIsCheckingAvailability(true)
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          items: selectedItems.map(item => ({
            type: item.type,
            id: item.id,
            quantity: item.quantity,
            unit: item.unit
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAvailabilityResults(data)
        
        if (data.available) {
          showToast({
            type: 'success',
            title: 'Disponibilidade confirmada',
            message: 'Todos os itens estão disponíveis para o período solicitado!'
          })
        } else {
          showToast({
            type: 'warning',
            title: 'Disponibilidade parcial',
            message: 'Alguns itens não estão disponíveis. Verifique os detalhes.'
          })
        }
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Erro na verificação',
          message: error.error || 'Erro ao verificar disponibilidade.'
        })
      }
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error)
      showToast({
        type: 'error',
        title: 'Erro na verificação',
        message: 'Erro ao verificar disponibilidade.'
      })
    } finally {
      setIsCheckingAvailability(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PRODUTO':
        return <Package className="w-4 h-4 text-blue-600" />
      case 'ACESSÓRIO':
        return <Settings className="w-4 h-4 text-green-600" />
      case 'EQUIPAMENTO':
        return <Wrench className="w-4 h-4 text-red-600" />
      default:
        return <Package className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DISPONÍVEL':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'INDISPONÍVEL':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPONÍVEL':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'INDISPONÍVEL':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Verificar Disponibilidade</h1>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estoque Atual */}
        {systemAvailability && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Gauge className="w-5 h-5 mr-2" />
              Estoque Atual (Atualizado em tempo real)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Package className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {systemAvailability.summary.totalProducts}
                  </div>
                  <div className="text-sm text-blue-700">Produtos</div>
                  <div className="text-xs text-blue-600">
                    {systemAvailability.summary.availableProductMeters} metros disponíveis
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Settings className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {systemAvailability.summary.totalAccessories}
                  </div>
                  <div className="text-sm text-green-700">Acessórios</div>
                  <div className="text-xs text-green-600">
                    {systemAvailability.summary.availableAccessoryQty} unidades disponíveis
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Wrench className="w-8 h-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {systemAvailability.summary.totalEquipment}
                  </div>
                  <div className="text-sm text-red-700">Equipamentos</div>
                  <div className="text-xs text-red-600">
                    {systemAvailability.summary.availableEquipmentQty} unidades disponíveis
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-blue-600">
              Última atualização: {new Date(systemAvailability.summary.lastUpdated).toLocaleString('pt-BR')}
            </div>
          </div>
        )}

        {/* Formulário de Verificação */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Verificação de Disponibilidade</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Fim
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Seleção de Itens */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Selecionar Itens para Verificar</h3>
            
            {/* Produtos */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Package className="w-4 h-4 mr-2 text-blue-600" />
                Produtos
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemAvailability?.currentAvailability.products.map((product) => (
                  <label key={product.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.some(item => item.id === product.id && item.type === 'PRODUTO')}
                      onChange={(e) => handleItemSelection('PRODUTO', product, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {product.name} ({product.availableMeters} metros disponíveis)
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Acessórios */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Settings className="w-4 h-4 mr-2 text-green-600" />
                Acessórios
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemAvailability?.currentAvailability.accessories.map((accessory) => (
                  <label key={accessory.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.some(item => item.id === accessory.id && item.type === 'ACESSÓRIO')}
                      onChange={(e) => handleItemSelection('ACESSÓRIO', accessory, e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">
                      {accessory.name} ({accessory.availableQty} unidades disponíveis)
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Equipamentos */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Wrench className="w-4 h-4 mr-2 text-red-600" />
                Equipamentos
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemAvailability?.currentAvailability.equipment.map((equipment) => (
                  <label key={equipment.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.some(item => item.id === equipment.id && item.type === 'EQUIPAMENTO')}
                      onChange={(e) => handleItemSelection('EQUIPAMENTO', equipment, e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">
                      {equipment.name} ({equipment.availableQty} unidades disponíveis)
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Itens Selecionados com Quantidades */}
          {selectedItems.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Itens Selecionados e Quantidades</h3>
              <div className="space-y-3">
                {selectedItems.map((item, index) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(item.type)}
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">Código: {item.code}</div>
                        <div className="text-xs text-gray-400">
                          Máximo disponível: {item.maxAvailable} {item.unit}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">
                          Quantidade:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={item.maxAvailable}
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.id, item.type, parseInt(e.target.value) || 1)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-sm text-gray-500">{item.unit}</span>
                      </div>
                      
                      <button
                        onClick={() => removeSelectedItem(item.id, item.type)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão de Verificação */}
          <div className="flex justify-center">
            <button
              onClick={checkAvailability}
              disabled={isCheckingAvailability || selectedItems.length === 0}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isCheckingAvailability ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Verificar Disponibilidade</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500 flex items-center justify-center">
            <Calendar className="w-4 h-4 mr-2" />
            Preencha as datas, selecione os itens e defina as quantidades para verificar disponibilidade
          </div>
        </div>

        {/* Resultados da Verificação */}
        {availabilityResults && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Resultados da Verificação</h2>
            
            {/* Resumo */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {availabilityResults.summary.totalItems}
                  </div>
                  <div className="text-sm text-gray-600">Total de Itens</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {availabilityResults.summary.availableItems}
                  </div>
                  <div className="text-sm text-gray-600">Disponíveis</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {availabilityResults.summary.unavailableItems}
                  </div>
                  <div className="text-sm text-gray-600">Indisponíveis</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${
                    availabilityResults.summary.generalStatus === 'TOTALMENTE_DISPONIVEL' 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {availabilityResults.summary.generalStatus === 'TOTALMENTE_DISPONIVEL' ? '✅' : '⚠️'}
                  </div>
                  <div className="text-sm text-gray-600">Status Geral</div>
                </div>
              </div>
            </div>

            {/* Período */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">Período Verificado</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-900">
                      <strong>Início:</strong> {formatDate(availabilityResults.period.startDate)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-900">
                      <strong>Fim:</strong> {formatDate(availabilityResults.period.endDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resultados Detalhados */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Detalhes por Item</h3>
              
              {availabilityResults.results.map((item) => (
                <div key={`${item.type}-${item.id}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(item.type)}
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">Código: {item.code}</div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(item.status)}
                        <span>{item.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{item.requestedQuantity}</div>
                      <div className="text-xs text-gray-500">Solicitado</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{item.availableQuantity}</div>
                      <div className="text-xs text-gray-500">Disponível</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-600">{item.totalQuantity}</div>
                      <div className="text-xs text-gray-500">Total em Estoque</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{item.occupiedQuantity}</div>
                      <div className="text-xs text-gray-500">Ocupado</div>
                    </div>
                  </div>

                  {item.reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-800">{item.reason}</span>
                      </div>
                    </div>
                  )}

                  {/* Locações Ocupando */}
                  {item.occupyingBookings.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Locações Ocupando este Item:</h4>
                      <div className="space-y-2">
                        {item.occupyingBookings.map((booking, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{booking.eventTitle}</div>
                                <div className="text-sm text-gray-600">Cliente: {booking.clientName}</div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.occupiedQuantity} {item.unit}
                                </div>
                                <div className={`text-xs px-2 py-1 rounded-full ${
                                  booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {booking.status}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recomendação */}
            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {availabilityResults.available ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    {availabilityResults.available ? 'Disponibilidade Confirmada' : 'Atenção Necessária'}
                  </h4>
                  <p className="text-sm text-blue-800 mt-1">
                    {availabilityResults.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
