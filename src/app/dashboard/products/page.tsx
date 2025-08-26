'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Edit, Trash2, Package, Wrench, Cable, Filter, Grid, List, BarChart3, Download, Image } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useToast } from '@/components/Toast'
import { useConfirmModal } from '@/components/Toast'
import ImageUpload from '@/components/ImageUpload'
import ExportData from '@/components/ExportData'
import InventoryCard from '@/components/InventoryCard'
import InventoryDashboard from '@/components/InventoryDashboard'

interface Product {
  id: string
  name: string
  code: string
  totalMeters: number
  pricePerMeter: number
  isAvailable: boolean
  imageUrl?: string
  description?: string
  createdAt: string
  updatedAt: string
  type: 'product'
}

interface Accessory {
  id: string
  name: string
  code: string
  totalQty: number
  pricePerUnit: number
  isAvailable: boolean
  imageUrl?: string
  description?: string
  category?: string
  createdAt: string
  updatedAt: string
  type: 'accessory'
}

interface Equipment {
  id: string
  name: string
  code: string
  description?: string
  totalQty: number
  pricePerUnit: number
  category?: string
  brand?: string
  model?: string
  isAvailable: boolean
  imageUrl?: string
  serialNumber?: string
  purchaseDate?: string
  warrantyExpiry?: string
  maintenanceDate?: string
  createdAt: string
  updatedAt: string
  type: 'equipment'
}

type InventoryItem = Product | Equipment | Accessory

export default function InventoryPage() {
  const [allItems, setAllItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'product' | 'equipment' | 'accessory'>('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterAvailable, setFilterAvailable] = useState<'all' | 'available' | 'unavailable'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'price' | 'quantity'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [showDashboard, setShowDashboard] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  
  const { showToast } = useToast()
  const { showConfirmModal, ConfirmModal } = useConfirmModal()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    quantity: '',
    price: '',
    unitType: 'unit' as 'unit' | 'meter',
    category: '',
    brand: '',
    model: '',
    itemType: 'product' as 'product' | 'equipment' | 'accessory',
    imageUrl: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    maintenanceDate: ''
  })

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }
    } catch (error) {
      console.error('Erro na autenticação:', error)
      router.push('/login')
    }
  }

  const loadData = async () => {
    try {
      const [productsRes, equipmentRes, accessoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/equipment'),
        fetch('/api/accessories')
      ])

      const products = productsRes.ok ? await productsRes.json() : []
      const equipment = equipmentRes.ok ? await equipmentRes.json() : []
      const accessories = accessoriesRes.ok ? await accessoriesRes.json() : []

      // Adicionar tipo a cada item
      const typedProducts = products.map((p: any) => ({ ...p, type: 'product' as const }))
      const typedEquipment = equipment.map((e: any) => ({ ...e, type: 'equipment' as const }))
      const typedAccessories = accessories.map((a: any) => ({ ...a, type: 'accessory' as const }))

      setAllItems([...typedProducts, ...typedEquipment, ...typedAccessories])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      showToast({
        type: 'error',
        title: 'Erro ao carregar',
        message: 'Erro ao carregar dados do inventário.'
      })
    } finally {
      setLoading(false)
    }
  }

  // Funções auxiliares
  const getItemIcon = (item: InventoryItem) => {
    switch (item.type) {
      case 'product': return <Package className="w-5 h-5" />
      case 'equipment': return <Wrench className="w-5 h-5" />
      case 'accessory': return <Cable className="w-5 h-5" />
    }
  }

  const getItemTypeColor = (item: InventoryItem) => {
    switch (item.type) {
      case 'product': return 'blue'
      case 'equipment': return 'purple'
      case 'accessory': return 'green'
    }
  }

  const getItemTypeName = (item: InventoryItem) => {
    switch (item.type) {
      case 'product': return 'Produto'
      case 'equipment': return 'Equipamento'
      case 'accessory': return 'Acessório'
    }
  }

  const formatQuantity = (item: InventoryItem) => {
    if (item.type === 'product') {
      return `${(item as Product).totalMeters} m²`
    } else {
      return `${(item as Equipment | Accessory).totalQty} un`
    }
  }

  const formatPrice = (item: InventoryItem) => {
    if (item.type === 'product') {
      return `R$ ${parseFloat((item as Product).pricePerMeter.toString()).toFixed(2)}/m²`
    } else {
      return `R$ ${parseFloat((item as Equipment | Accessory).pricePerUnit.toString()).toFixed(2)}/un`
    }
  }

  const getTotalValue = (item: InventoryItem) => {
    if (item.type === 'product') {
      return (item as Product).totalMeters * parseFloat((item as Product).pricePerMeter.toString())
    } else {
      return (item as Equipment | Accessory).totalQty * parseFloat((item as Equipment | Accessory).pricePerUnit.toString())
    }
  }

  const isLowStock = (item: InventoryItem) => {
    if (item.type === 'product') {
      return (item as Product).totalMeters < 10
    } else {
      return (item as Equipment | Accessory).totalQty < 5
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.code || !formData.quantity || !formData.price) {
      showToast({
        type: 'warning',
        title: 'Campos obrigatórios',
        message: 'Nome, código, quantidade e preço são obrigatórios.'
      })
        return
      }

      try {
      let url = ''
      let method = 'POST'
      let requestData: any = {}

      if (formData.itemType === 'product') {
        url = editingItem && editingItem.type === 'product' ? `/api/products/${editingItem.id}` : '/api/products'
        method = editingItem && editingItem.type === 'product' ? 'PUT' : 'POST'
        requestData = {
          name: formData.name,
          code: formData.code,
          totalMeters: parseFloat(formData.quantity),
          pricePerMeter: parseFloat(formData.price),
          description: formData.description
        }
      } else if (formData.itemType === 'equipment') {
        url = editingItem && editingItem.type === 'equipment' ? `/api/equipment/${editingItem.id}` : '/api/equipment'
        method = editingItem && editingItem.type === 'equipment' ? 'PUT' : 'POST'
        requestData = {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          totalQty: parseInt(formData.quantity),
          pricePerUnit: parseFloat(formData.price),
          category: formData.category,
          brand: formData.brand,
          model: formData.model,
          serialNumber: formData.serialNumber,
          purchaseDate: formData.purchaseDate,
          warrantyExpiry: formData.warrantyExpiry,
          maintenanceDate: formData.maintenanceDate
        }
      } else {
        url = editingItem && editingItem.type === 'accessory' ? `/api/accessories/${editingItem.id}` : '/api/accessories'
        method = editingItem && editingItem.type === 'accessory' ? 'PUT' : 'POST'
        requestData = {
          name: formData.name,
          code: formData.code,
          totalQty: parseInt(formData.quantity),
          pricePerUnit: parseFloat(formData.price),
          description: formData.description,
          category: formData.category
        }
      }

        const response = await fetch(url, {
          method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const itemTypeName = formData.itemType === 'product' ? 'Produto' : 
                           formData.itemType === 'equipment' ? 'Equipamento' : 'Acessório'
        showToast({
          type: 'success',
          title: `${itemTypeName} ${editingItem ? 'atualizado' : 'criado'}!`,
          message: `${itemTypeName} foi ${editingItem ? 'atualizado' : 'criado'} com sucesso.`
        })
        resetForm()
        loadData()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar item')
      }
    } catch (error) {
      console.error('Erro ao salvar item:', error)
      showToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: error instanceof Error ? error.message : 'Erro ao salvar item.'
      })
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
      setFormData({
      name: item.name,
      code: item.code,
      description: item.type === 'equipment' ? (item as Equipment).description || '' : 
                  item.type === 'accessory' ? (item as Accessory).description || '' : '',
      quantity: item.type === 'product' ? (item as Product).totalMeters.toString() : (item as Equipment | Accessory).totalQty.toString(),
      price: item.type === 'product' ? (item as Product).pricePerMeter.toString() : (item as Equipment | Accessory).pricePerUnit.toString(),
      unitType: item.type === 'product' ? 'meter' : 'unit',
      category: item.type === 'equipment' ? (item as Equipment).category || '' : 
               item.type === 'accessory' ? (item as Accessory).category || '' : '',
      brand: item.type === 'equipment' ? (item as Equipment).brand || '' : '',
      model: item.type === 'equipment' ? (item as Equipment).model || '' : '',
      itemType: item.type,
      imageUrl: item.imageUrl || '',
      serialNumber: item.type === 'equipment' ? (item as Equipment).serialNumber || '' : '',
      purchaseDate: item.type === 'equipment' ? (item as Equipment).purchaseDate || '' : '',
      warrantyExpiry: item.type === 'equipment' ? (item as Equipment).warrantyExpiry || '' : '',
      maintenanceDate: item.type === 'equipment' ? (item as Equipment).maintenanceDate || '' : ''
    })
    setShowForm(true)
  }

  const handleDelete = async (item: InventoryItem) => {
    const itemTypeName = item.type === 'product' ? 'produto' : item.type === 'equipment' ? 'equipamento' : 'acessório'

    showConfirmModal({
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o ${itemTypeName} "${item.name}"?`,
      onConfirm: async () => {
    try {
          const url = item.type === 'product' ? `/api/products/${item.id}` : 
                      item.type === 'equipment' ? `/api/equipment/${item.id}` : 
                      `/api/accessories/${item.id}`

      const response = await fetch(url, { method: 'DELETE' })

          if (response.ok) {
            showToast({
              type: 'success',
              title: `${itemTypeName.charAt(0).toUpperCase() + itemTypeName.slice(1)} excluído!`,
              message: `${itemTypeName.charAt(0).toUpperCase() + itemTypeName.slice(1)} foi excluído com sucesso.`
            })
            loadData()
          } else {
            const error = await response.json()
            throw new Error(error.error || `Erro ao excluir ${itemTypeName}`)
          }
        } catch (error) {
          console.error(`Erro ao excluir ${itemTypeName}:`, error)
          showToast({
            type: 'error',
            title: 'Erro ao excluir',
            message: error instanceof Error ? error.message : `Erro ao excluir ${itemTypeName}.`
          })
        }
      },
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      quantity: '',
      price: '',
      unitType: 'unit',
      category: '',
      brand: '',
      model: '',
      itemType: 'product',
      imageUrl: '',
      serialNumber: '',
      purchaseDate: '',
      warrantyExpiry: '',
      maintenanceDate: ''
    })
    setEditingItem(null)
    setShowForm(false)
    setImageFile(null)
  }

  const getFilteredItems = () => {
    let filtered = allItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.code.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = filterType === 'all' || item.type === filterType
      
      const matchesCategory = !filterCategory || 
                             (item.type === 'equipment' && (item as Equipment).category === filterCategory) ||
                             (item.type === 'accessory' && (item as Accessory).category === filterCategory)
      
      const matchesAvailability = filterAvailable === 'all' ||
                                 (filterAvailable === 'available' && item.isAvailable) ||
                                 (filterAvailable === 'unavailable' && !item.isAvailable)
      
      return matchesSearch && matchesType && matchesCategory && matchesAvailability
    })

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'code':
          aValue = a.code.toLowerCase()
          bValue = b.code.toLowerCase()
          break
        case 'price':
          aValue = a.type === 'product' ? (a as Product).pricePerMeter : (a as Equipment | Accessory).pricePerUnit
          bValue = b.type === 'product' ? (b as Product).pricePerMeter : (b as Equipment | Accessory).pricePerUnit
          break
        case 'quantity':
          aValue = a.type === 'product' ? (a as Product).totalMeters : (a as Equipment | Accessory).totalQty
          bValue = b.type === 'product' ? (b as Product).totalMeters : (b as Equipment | Accessory).totalQty
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }

  const getCategories = () => {
    const categories = new Set<string>()
    allItems.forEach(item => {
      if (item.type === 'equipment' && (item as Equipment).category) {
        categories.add((item as Equipment).category!)
      }
      if (item.type === 'accessory' && (item as Accessory).category) {
        categories.add((item as Accessory).category!)
      }
    })
    return Array.from(categories)
  }

  // Configuração para exportação
  const exportColumns = [
    { key: 'name', label: 'Nome', formatter: (value: string) => value },
    { key: 'code', label: 'Código', formatter: (value: string) => value },
    { key: 'type', label: 'Tipo', formatter: (value: string) => getItemTypeName({ type: value } as any) },
    { key: 'quantity', label: 'Quantidade', formatter: (value: any) => '' },
    { key: 'price', label: 'Preço Unitário', formatter: (value: any) => '' },
    { key: 'totalValue', label: 'Valor Total', formatter: (value: any) => '' },
    { key: 'isAvailable', label: 'Disponível', formatter: (value: boolean) => value ? 'Sim' : 'Não' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando inventário...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">📦</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Inventário Completo</h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* Dashboard Toggle */}
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  showDashboard 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Dashboard</span>
              </button>

              {/* View Mode Toggle */}
              {!showDashboard && (
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'cards' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
              </div>
              )}

              {/* Export Button */}
              {!showDashboard && (
                <ExportData
                  data={getFilteredItems()}
                  filename="inventario"
                  columns={exportColumns}
                />
              )}

              {/* Add Item Button */}
            <button
                onClick={() => {
                  setEditingItem(null)
                  resetForm()
                  setShowForm(true)
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Adicionar Item</span>
            </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showDashboard ? (
          <InventoryDashboard
            items={allItems}
            getItemTypeColor={getItemTypeColor}
            getItemTypeName={getItemTypeName}
            getTotalValue={getTotalValue}
            formatQuantity={formatQuantity}
          />
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Search */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
                      placeholder="Nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos</option>
                    <option value="product">Produtos</option>
                    <option value="equipment">Equipamentos</option>
                    <option value="accessory">Acessórios</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    {getCategories().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterAvailable}
                    onChange={(e) => setFilterAvailable(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos</option>
                    <option value="available">Disponível</option>
                    <option value="unavailable">Indisponível</option>
                  </select>
                  </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar</label>
                  <div className="flex space-x-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="name">Nome</option>
                      <option value="code">Código</option>
                      <option value="price">Preço</option>
                      <option value="quantity">Quantidade</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                  </div>
                </div>
                
              {/* Results Count */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {getFilteredItems().length} item(ns) encontrado(s)
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Produtos</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span>Equipamentos</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Acessórios</span>
                  </div>
                  </div>
                  </div>
                </div>
              </div>

            {/* Items Display */}
            {viewMode === 'table' ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantidade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Preço Unitário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredItems().map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-${getItemTypeColor(item)}-100`}>
                                <div className={`text-${getItemTypeColor(item)}-600`}>
                                  {getItemIcon(item)}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-500">Código: {item.code}</div>
                                {item.type === 'equipment' && (item as Equipment).brand && (item as Equipment).model && (
                                  <div className="text-xs text-gray-400">
                                    {(item as Equipment).brand} - {(item as Equipment).model}
                                  </div>
                                )}
                                {item.type === 'equipment' && (item as Equipment).category && (
                                  <div className="text-xs text-gray-400">
                                    Categoria: {(item as Equipment).category}
              </div>
            )}
          </div>
                  </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getItemTypeColor(item)}-100 text-${getItemTypeColor(item)}-800`}>
                              {getItemTypeName(item)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatQuantity(item)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(item)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            R$ {getTotalValue(item).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.isAvailable 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.isAvailable ? 'Disponível' : 'Indisponível'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                    <button
                                onClick={() => handleEdit(item)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="Editar"
                    >
                                <Edit className="w-4 h-4" />
                    </button>
                    <button
                                onClick={() => handleDelete(item)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Excluir"
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
                
                {getFilteredItems().length === 0 && (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      Nenhum item encontrado
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || filterType !== 'all' || filterCategory || filterAvailable !== 'all' 
                        ? 'Tente ajustar os filtros de busca.' 
                        : 'Comece adicionando seu primeiro item.'
                      }
                    </p>
              </div>
            )}
          </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {getFilteredItems().map((item) => (
                  <InventoryCard
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    getItemTypeColor={getItemTypeColor}
                    getItemIcon={getItemIcon}
                    getItemTypeName={getItemTypeName}
                    formatQuantity={formatQuantity}
                    formatPrice={formatPrice}
                    getTotalValue={getTotalValue}
                    isLowStock={isLowStock}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Editar' : 'Novo'} Item do Inventário
            </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Item Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Item *
                    </label>
                    <select
                      value={formData.itemType}
                      onChange={(e) => {
                        const newType = e.target.value as 'product' | 'equipment' | 'accessory'
                        setFormData({
                          ...formData,
                          itemType: newType,
                          unitType: newType === 'product' ? 'meter' : 'unit'
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="product">Produto (por metro²)</option>
                      <option value="equipment">Equipamento (por unidade)</option>
                      <option value="accessory">Acessório (por unidade)</option>
                    </select>
                </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                </label>
                <input
                  type="text"
                      required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do item"
                />
              </div>
              
                  {/* Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código *
                </label>
                <input
                  type="text"
                      required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Código único"
                />
              </div>
              
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.itemType === 'product' ? 'Metros Quadrados' : 'Quantidade Total'} *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step={formData.itemType === 'product' ? '0.01' : '1'}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={formData.itemType === 'product' ? '0.00' : '0'}
                      required
                    />
                  </div>
                  
                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço {formData.itemType === 'product' ? 'por Metro Quadrado' : 'por Unidade'} (R$) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Equipment specific fields */}
                  {formData.itemType === 'equipment' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoria
                          </label>
                          <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: Som, Iluminação"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Marca
                    </label>
                    <input
                            type="text"
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Marca do equipamento"
                    />
                  </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Modelo
                    </label>
                    <input
                          type="text"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Modelo específico"
                    />
                  </div>
                </>
              )}
              
                  {/* Accessory category */}
                  {formData.itemType === 'accessory' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Categoria do acessório"
                      />
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descrição detalhada..."
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Imagem do Item
                    </label>
                    <ImageUpload
                      currentImage={editingItem?.imageUrl}
                      onImageChange={setImageFile}
                      alt={formData.name || 'Item do inventário'}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingItem ? 'Atualizar' : 'Criar'} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ConfirmModal */}
      {ConfirmModal}
    </div>
  )
}
