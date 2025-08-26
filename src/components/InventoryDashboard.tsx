'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Package, 
  Wrench, 
  Cable, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Activity
} from 'lucide-react'

interface InventoryDashboardProps {
  items: any[]
  getItemTypeColor: (item: any) => string
  getItemTypeName: (item: any) => string
  getTotalValue: (item: any) => number
  formatQuantity: (item: any) => string
}

export default function InventoryDashboard({ 
  items, 
  getItemTypeColor, 
  getItemTypeName, 
  getTotalValue,
  formatQuantity 
}: InventoryDashboardProps) {
  const [metrics, setMetrics] = useState({
    totalItems: 0,
    totalValue: 0,
    availableItems: 0,
    unavailableItems: 0,
    lowStockItems: 0,
    byType: { product: 0, equipment: 0, accessory: 0 },
    byValue: { product: 0, equipment: 0, accessory: 0 }
  })

  useEffect(() => {
    calculateMetrics()
  }, [items])

  const calculateMetrics = () => {
    const total = items.length
    const totalValue = items.reduce((sum, item) => sum + getTotalValue(item), 0)
    const available = items.filter(item => item.isAvailable).length
    const unavailable = total - available
    
    // Low stock items (less than 5 for units, less than 10m² for products)
    const lowStock = items.filter(item => {
      if (item.type === 'product') {
        return (item as any).totalMeters < 10
      } else {
        return (item as any).totalQty < 5
      }
    }).length

    // Group by type
    const byType = {
      product: items.filter(item => item.type === 'product').length,
      equipment: items.filter(item => item.type === 'equipment').length,
      accessory: items.filter(item => item.type === 'accessory').length
    }

    // Value by type
    const byValue = {
      product: items
        .filter(item => item.type === 'product')
        .reduce((sum, item) => sum + getTotalValue(item), 0),
      equipment: items
        .filter(item => item.type === 'equipment')
        .reduce((sum, item) => sum + getTotalValue(item), 0),
      accessory: items
        .filter(item => item.type === 'accessory')
        .reduce((sum, item) => sum + getTotalValue(item), 0)
    }

    setMetrics({
      totalItems: total,
      totalValue,
      availableItems: available,
      unavailableItems: unavailable,
      lowStockItems: lowStock,
      byType,
      byValue
    })
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue',
    subtitle = ''
  }: {
    title: string
    value: string | number
    icon: any
    color?: string
    subtitle?: string
  }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  )

  const PieChart = ({ data, title }: { data: { [key: string]: number }, title: string }) => {
    const colors = ['#3B82F6', '#8B5CF6', '#10B981']
    const entries = Object.entries(data)
    const total = Object.values(data).reduce((sum, val) => sum + val, 0)

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {entries.map(([key, value], index) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="text-sm text-gray-700 capitalize">
                  {key === 'product' ? 'Produtos' : 
                   key === 'equipment' ? 'Equipamentos' : 'Acessórios'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">{value}</span>
                <span className="text-xs text-gray-500">
                  ({total > 0 ? Math.round((value / total) * 100) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const BarChart = ({ data, title }: { data: { [key: string]: number }, title: string }) => {
    const colors = ['#3B82F6', '#8B5CF6', '#10B981']
    const entries = Object.entries(data)
    const maxValue = Math.max(...Object.values(data))

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-4">
          {entries.map(([key, value], index) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 capitalize">
                  {key === 'product' ? 'Produtos' : 
                   key === 'equipment' ? 'Equipamentos' : 'Acessórios'}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  R$ {value.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`,
                    backgroundColor: colors[index % colors.length]
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Dashboard do Inventário</h2>
        </div>
        <p className="text-gray-600">
          Visão geral do seu inventário com métricas importantes e análises.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Itens"
          value={metrics.totalItems}
          icon={Package}
          color="blue"
          subtitle="Todos os tipos"
        />
        <StatCard
          title="Valor Total"
          value={`R$ ${metrics.totalValue.toLocaleString('pt-BR')}`}
          icon={DollarSign}
          color="green"
          subtitle="Inventário completo"
        />
        <StatCard
          title="Itens Disponível"
          value={metrics.availableItems}
          icon={Activity}
          color="green"
          subtitle={`${metrics.totalItems > 0 ? Math.round((metrics.availableItems / metrics.totalItems) * 100) : 0}% do total`}
        />
        <StatCard
          title="Estoque Baixo"
          value={metrics.lowStockItems}
          icon={AlertTriangle}
          color="red"
          subtitle="Precisa atenção"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart 
          data={metrics.byType} 
          title="Distribuição por Tipo"
        />
        <BarChart 
          data={metrics.byValue} 
          title="Valor por Tipo"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Adicionar Produto</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Wrench className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Adicionar Equipamento</span>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Cable className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Adicionar Acessório</span>
          </button>
        </div>
      </div>
    </div>
  )
}
