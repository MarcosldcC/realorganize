'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import Link from 'next/link'
import { Plus, Edit, Trash2, Search, Calendar, MapPin, DollarSign, User, Clock, X, FileText, Wrench } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useToast, useConfirmModal } from '@/components/Toast'
import ContractViewer from '@/components/ContractViewer'


interface Product {
  id: string
  name: string
  code: string
  totalMeters: number
  pricePerMeter: number
}

interface Accessory {
  id: string
  name: string
  code: string
  totalQty: number
  pricePerUnit: number
}

interface Equipment {
  id: string
  name: string
  code: string
  totalQty: number
  pricePerUnit: number
  brand?: string
  model?: string
  category?: string
}

interface BookingItem {
  productId: string
  meters: number
  product: Product
}

interface BookingAccessory {
  accessoryId: string
  qty: number
  accessory: Accessory
}

interface BookingEquipment {
  equipmentId: string
  qty: number
  equipment: Equipment
}

// Interface específica para o ContractViewer
interface ContractBooking {
  id: string
  clientId: string
  client: {
    name: string
    email: string
    phone?: string
    address?: string
    company?: string
    document?: string
  }
  startDate: string
  endDate: string
  status: string
  eventTitle: string
  eventAddress: string
  totalValue: number
  paymentStatus: string
  notes?: string
  createdAt: string
  items: Array<{
    meters: number
    product: {
      name: string
      code: string
      pricePerMeter: number
    }
  }>
  accessories: Array<{
    qty: number
    accessory: {
      name: string
      code: string
      pricePerUnit: number
    }
  }>
  equipment: Array<{
    qty: number
    equipment: {
      name: string
      code: string
      pricePerUnit: number
      brand?: string
      model?: string
    }
  }>
}

interface Booking {
  id: string
  clientId: string
  client: {
    name: string
    email: string
    phone?: string
    address?: string
    company?: string
    document?: string
  }
  startDate: string
  endDate: string
  status: 'CONFIRMED' | 'PENDING' | 'RETURNED' | 'CANCELLED'
  eventTitle: string
  eventAddress: string
  totalValue: number
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE'
  notes?: string
  createdAt: string
  items?: BookingItem[]
  accessories?: BookingAccessory[]
  equipment?: BookingEquipment[]
}

export default function BookingsPage() {
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [accessories, setAccessories] = useState<Accessory[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [formData, setFormData] = useState({
    clientId: '',
    startDate: '',
    endDate: '',
    eventTitle: '',
    eventAddress: '',
    totalValue: '',
    status: 'HOLD',
    paymentStatus: 'PENDING'
  })
  const [selectedProducts, setSelectedProducts] = useState<BookingItem[]>([])
  const [selectedAccessories, setSelectedAccessories] = useState<BookingAccessory[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<BookingEquipment[]>([])
  const [showContract, setShowContract] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<ContractBooking | null>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)

  const [isChecking, setIsChecking] = useState(false)
  
  const router = useRouter()
  const { showToast } = useToast()
  const { showConfirmModal, ConfirmModal } = useConfirmModal()

  useEffect(() => {
    checkAuth()
    loadBookings()
    loadClients()
    loadProducts()
    loadAccessories()
    loadEquipment()
    loadCompanySettings()
  }, [])

  useEffect(() => {
    calculateTotalPrice()
  }, [selectedProducts, selectedAccessories, selectedEquipment])

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

  const loadBookings = async () => {
    try {
      const response = await fetch('/api/bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Erro ao carregar locações:', error)
    } finally {
      setLoading(false)
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

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const loadAccessories = async () => {
    try {
      const response = await fetch('/api/accessories')
      if (response.ok) {
        const data = await response.json()
        setAccessories(data)
      }
    } catch (error) {
      console.error('Erro ao carregar acessórios:', error)
    }
  }

  const loadEquipment = async () => {
    try {
      console.log('Carregando equipamentos...')
      const response = await fetch('/api/equipment')
      console.log('Resposta da API equipamentos:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Equipamentos carregados:', data)
        setEquipment(data)
      } else {
        console.error('Erro na resposta da API equipamentos:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error)
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

  const calculateTotalPrice = () => {
    let total = 0
    
    // Calcular preço dos produtos (metros × preço por metro)
    selectedProducts.forEach(item => {
      if (item.product && item.product.pricePerMeter && item.meters) {
        total += item.meters * parseFloat(item.product.pricePerMeter.toString())
      }
    })
    
    // Calcular preço dos acessórios (quantidade × preço por unidade)
    selectedAccessories.forEach(item => {
      if (item.accessory && item.accessory.pricePerUnit && item.qty) {
        total += item.qty * parseFloat(item.accessory.pricePerUnit.toString())
      }
    })

    // Calcular preço dos equipamentos (quantidade × preço por unidade)
    selectedEquipment.forEach(item => {
      if (item.equipment && item.equipment.pricePerUnit && item.qty) {
        total += item.qty * parseFloat(item.equipment.pricePerUnit.toString())
      }
    })
    
    setFormData(prev => ({ ...prev, totalValue: total.toFixed(2) }))
  }

  const addProduct = () => {
    console.log('Adicionando produto...')
    const newProduct = { 
      productId: '', 
      meters: 0, 
      product: {} as Product 
    }
    setSelectedProducts([...selectedProducts, newProduct])
    console.log('Produtos atualizados:', [...selectedProducts, newProduct])
  }

  const removeProduct = (index: number) => {
    const newProducts = selectedProducts.filter((_, i) => i !== index)
    setSelectedProducts(newProducts)
  }

  const updateProduct = (index: number, field: 'productId' | 'meters', value: string | number) => {
    const newProducts = [...selectedProducts]
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      newProducts[index] = { ...newProducts[index], productId: value as string, product: product || {} as Product }
    } else {
      newProducts[index] = { ...newProducts[index], meters: value as number }
    }
    setSelectedProducts(newProducts)
  }

  const addAccessory = () => {
    console.log('Adicionando acessório...')
    const newAccessory = { 
      accessoryId: '', 
      qty: 0, 
      accessory: {} as Accessory 
    }
    setSelectedAccessories([...selectedAccessories, newAccessory])
    console.log('Acessórios atualizados:', [...selectedAccessories, newAccessory])
  }

  const removeAccessory = (index: number) => {
    const newAccessories = selectedAccessories.filter((_, i) => i !== index)
    setSelectedAccessories(newAccessories)
  }

  const updateAccessory = (index: number, field: 'accessoryId' | 'qty', value: string | number) => {
    const newAccessories = [...selectedAccessories]
    if (field === 'accessoryId') {
      const accessory = accessories.find(a => a.id === value)
      newAccessories[index] = { ...newAccessories[index], accessoryId: value as string, accessory: accessory || {} as Accessory }
    } else {
      newAccessories[index] = { ...newAccessories[index], qty: value as number }
    }
    setSelectedAccessories(newAccessories)
  }

  const addEquipment = () => {
    console.log('Adicionando equipamento...')
    const newEquipment = { 
      equipmentId: '', 
      qty: 0, 
      equipment: {} as Equipment 
    }
    setSelectedEquipment([...selectedEquipment, newEquipment])
    console.log('Equipamentos atualizados:', [...selectedEquipment, newEquipment])
  }

  const removeEquipment = (index: number) => {
    const newEquipment = selectedEquipment.filter((_, i) => i !== index)
    setSelectedEquipment(newEquipment)
  }

  const updateEquipment = (index: number, field: 'equipmentId' | 'qty', value: string | number) => {
    const newEquipment = [...selectedEquipment]
    if (field === 'equipmentId') {
      const equipmentItem = equipment.find(e => e.id === value)
      newEquipment[index] = { ...newEquipment[index], equipmentId: value as string, equipment: equipmentItem || {} as Equipment }
    } else {
      newEquipment[index] = { ...newEquipment[index], qty: value as number }
    }
    setSelectedEquipment(newEquipment)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Iniciando envio do formulário...')
    console.log('Dados do formulário:', formData)
    console.log('Produtos selecionados:', selectedProducts)
    console.log('Acessórios selecionados:', selectedAccessories)
    
         // Validar se há produtos selecionados
     if (selectedProducts.length === 0 && selectedAccessories.length === 0 && selectedEquipment.length === 0) {
       console.log('Validação falhou - nenhum item selecionado')
       showToast({
         type: 'warning',
         title: 'Itens obrigatórios',
         message: 'Por favor, selecione pelo menos um produto, acessório ou equipamento'
       })
       return
     }

     // Validar produtos se houver
     if (selectedProducts.length > 0 && selectedProducts.some(p => !p.productId || p.meters <= 0)) {
       console.log('Validação falhou - produtos inválidos')
       showToast({
         type: 'warning',
         title: 'Produtos obrigatórios',
         message: 'Por favor, complete todos os dados dos produtos selecionados'
       })
       return
     }

     // Validar acessórios se houver
     if (selectedAccessories.length > 0 && selectedAccessories.some(a => !a.accessoryId || a.qty <= 0)) {
       console.log('Validação falhou - acessórios inválidos')
       showToast({
         type: 'warning',
         title: 'Acessórios obrigatórios',
         message: 'Por favor, complete todos os dados dos acessórios selecionados'
       })
       return
     }

     // Validar equipamentos se houver
     if (selectedEquipment.length > 0 && selectedEquipment.some(e => !e.equipmentId || e.qty <= 0)) {
       console.log('Validação falhou - equipamentos inválidos')
       showToast({
         type: 'warning',
         title: 'Equipamentos obrigatórios',
         message: 'Por favor, complete todos os dados dos equipamentos selecionados'
       })
       return
     }
    
    // Validar campos obrigatórios
    if (!formData.clientId || !formData.startDate || !formData.endDate || !formData.eventTitle || !formData.eventAddress) {
      console.log('Validação falhou - campos obrigatórios não preenchidos')
      showToast({
        type: 'warning',
        title: 'Campos obrigatórios',
        message: 'Por favor, preencha todos os campos obrigatórios'
      })
      return
    }


    
    try {
      const url = editingBooking ? `/api/bookings/${editingBooking.id}` : '/api/bookings'
      const method = editingBooking ? 'PUT' : 'POST'
      
             const requestData = {
         ...formData,
         totalValue: parseFloat(formData.totalValue) || 0,
         products: selectedProducts.filter(p => p.productId && p.meters > 0),
         accessories: selectedAccessories.filter(a => a.accessoryId && a.qty > 0),
         equipment: selectedEquipment.filter(e => e.equipmentId && e.qty > 0)
       }
      
      console.log('Enviando dados para API:', requestData)
      console.log('URL:', url)
      console.log('Método:', method)
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      console.log('Resposta da API:', response.status, response.statusText)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Locação salva com sucesso:', result)
        
        setShowForm(false)
        setEditingBooking(null)
        setFormData({
          clientId: '',
          startDate: '',
          endDate: '',
          eventTitle: '',
          eventAddress: '',
          totalValue: '',
          status: 'PENDING',
          paymentStatus: 'PENDING'
        })
        setSelectedProducts([])
        setSelectedAccessories([])
        setSelectedEquipment([])
        loadBookings()
        
        showToast({
          type: 'success',
          title: editingBooking ? 'Locação atualizada!' : 'Locação criada!',
          message: editingBooking 
            ? 'A locação foi atualizada com sucesso.'
            : 'A locação foi criada com sucesso.'
        })
      } else {
        const errorData = await response.json()
        console.error('Erro na resposta da API:', errorData)
        showToast({
          type: 'error',
          title: editingBooking ? 'Erro ao atualizar locação' : 'Erro ao criar locação',
          message: errorData.error || 'Erro desconhecido'
        })
      }
    } catch (error) {
      console.error('Erro ao salvar locação:', error)
      showToast({
        type: 'error',
        title: 'Erro ao salvar locação',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking)
    setFormData({
      clientId: booking.clientId,
      startDate: new Date(booking.startDate).toISOString().split('T')[0],
      endDate: new Date(booking.endDate).toISOString().split('T')[0],
      eventTitle: booking.eventTitle,
      eventAddress: booking.eventAddress,
      totalValue: booking.totalValue ? booking.totalValue.toString() : '0',
      status: booking.status,
      paymentStatus: booking.paymentStatus
    })
    
    // Carregar produtos da locação
    if (booking.items && booking.items.length > 0) {
      const products = booking.items.map(item => ({
        productId: item.productId,
        meters: item.meters,
        product: item.product
      }))
      setSelectedProducts(products)
      console.log('Produtos carregados para edição:', products)
    } else {
      setSelectedProducts([])
    }
    
    // Carregar acessórios da locação
    if (booking.accessories && booking.accessories.length > 0) {
      const accessories = booking.accessories.map(acc => ({
        accessoryId: acc.accessoryId,
        qty: acc.qty,
        accessory: acc.accessory
      }))
      setSelectedAccessories(accessories)
      console.log('Acessórios carregados para edição:', accessories)
    } else {
      setSelectedAccessories([])
    }
    
    // Carregar equipamentos da locação
    if (booking.equipment && booking.equipment.length > 0) {
      const equipment = booking.equipment.map(equip => ({
        equipmentId: equip.equipmentId,
        qty: equip.qty,
        equipment: equip.equipment
      }))
      setSelectedEquipment(equipment)
      console.log('Equipamentos carregados para edição:', equipment)
    } else {
      setSelectedEquipment([])
    }
    
    setShowForm(true)
  }

  const handleDelete = async (bookingId: string) => {
    showConfirmModal({
      title: 'Confirmar exclusão',
      message: 'Tem certeza que deseja deletar esta locação? Esta ação não pode ser desfeita.',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      type: 'error',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' })
          if (response.ok) {
            loadBookings()
            showToast({
              type: 'success',
              title: 'Locação deletada',
              message: 'A locação foi deletada com sucesso.'
            })
          } else {
            showToast({
              type: 'error',
              title: 'Erro ao deletar',
              message: 'Erro ao deletar a locação.'
            })
          }
        } catch (error) {
          console.error('Erro ao deletar locação:', error)
          showToast({
            type: 'error',
            title: 'Erro ao deletar',
            message: 'Erro ao deletar a locação.'
          })
        }
      }
    })
  }

  const handleViewContract = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}?include=items,accessories`)
      if (response.ok) {
        const bookingData: Booking = await response.json()
        
        // Converter para o formato esperado pelo ContractViewer
        const contractBooking: ContractBooking = {
          ...bookingData,
          totalValue: bookingData.totalValue,
          items: bookingData.items?.map(item => ({
            meters: item.meters,
            product: {
              name: item.product.name,
              code: item.product.code,
              pricePerMeter: parseFloat(item.product.pricePerMeter.toString())
            }
          })) || [],
          accessories: bookingData.accessories?.map(acc => ({
            qty: acc.qty,
            accessory: {
              name: acc.accessory.name,
              code: acc.accessory.code,
              pricePerUnit: parseFloat(acc.accessory.pricePerUnit.toString())
            }
          })) || [],
          equipment: bookingData.equipment?.map(equip => ({
            qty: equip.qty,
            equipment: {
              name: equip.equipment.name,
              code: equip.equipment.code,
              pricePerUnit: parseFloat(equip.equipment.pricePerUnit.toString()),
              brand: equip.equipment.brand,
              model: equip.equipment.model
            }
          })) || []
        }
        
        setSelectedBooking(contractBooking)
        setShowContract(true)
      } else {
        showToast({
          type: 'error',
          title: 'Erro ao carregar',
          message: 'Erro ao carregar dados da locação.'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar locação:', error)
      showToast({
        type: 'error',
        title: 'Erro ao carregar',
        message: 'Erro ao carregar dados da locação.'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'RETURNED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PARTIAL': return 'bg-blue-100 text-blue-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBookings = bookings.filter(booking =>
    booking.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.eventAddress.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando locações...</p>
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
                <span className="text-white text-xl font-bold">📅</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Locações</h1>
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
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Locações ({filteredBookings.length})</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Nova Locação</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar locações por evento, cliente ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Booking Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingBooking ? 'Editar Locação' : 'Nova Locação'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título do Evento *</label>
                  <input
                    type="text"
                    required
                    value={formData.eventTitle}
                    onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço do Evento *</label>
                  <input
                    type="text"
                    required
                    value={formData.eventAddress}
                    onChange={(e) => setFormData({ ...formData, eventAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                                    value={formData.totalValue}
                onChange={(e) => setFormData({ ...formData, totalValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="RETURNED">Retornado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status do Pagamento</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago</option>
                    <option value="PARTIAL">Parcial</option>
                    <option value="OVERDUE">Atrasado</option>
                  </select>
                </div>
              </div>

              {/* Produtos */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Produtos</h4>
                  <button
                    type="button"
                    onClick={addProduct}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Adicionar Produto
                  </button>
                </div>
                
                {selectedProducts.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Nenhum produto selecionado. Clique em "Adicionar Produto" para começar.
                  </div>
                )}
                
                {selectedProducts.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <select
                        value={item.productId}
                        onChange={(e) => updateProduct(index, 'productId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Selecione um produto</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - R$ {parseFloat(product.pricePerMeter.toString()).toFixed(2)}/m²
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        placeholder="Metros"
                        value={item.meters || ''}
                        onChange={(e) => updateProduct(index, 'meters', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                        required
                      />
                    </div>
                    <div className="w-32 text-sm text-gray-600">
                      {item.product && item.product.pricePerMeter ? `R$ ${(item.meters * parseFloat(item.product.pricePerMeter.toString())).toFixed(2)}` : '-'}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Acessórios */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Acessórios</h4>
                  <button
                    type="button"
                    onClick={addAccessory}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    + Adicionar Acessório
                  </button>
                </div>
                
                {selectedAccessories.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Nenhum acessório selecionado. Clique em "Adicionar Acessório" para começar.
                  </div>
                )}
                
                {selectedAccessories.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <select
                        value={item.accessoryId}
                        onChange={(e) => updateAccessory(index, 'accessoryId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Selecione um acessório</option>
                        {accessories.map(accessory => (
                          <option key={accessory.id} value={accessory.id}>
                            {accessory.name} - R$ {parseFloat(accessory.pricePerUnit.toString()).toFixed(2)}/unidade
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        placeholder="Quantidade"
                        value={item.qty || ''}
                        onChange={(e) => updateAccessory(index, 'qty', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        min="1"
                      />
                    </div>
                    <div className="w-32 text-sm text-gray-600">
                      {item.accessory && item.accessory.pricePerUnit ? `R$ ${(item.qty * parseFloat(item.accessory.pricePerUnit.toString())).toFixed(2)}` : '-'}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAccessory(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Equipamentos */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Equipamentos</h4>
                  <button
                    type="button"
                    onClick={addEquipment}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    + Adicionar Equipamento
                  </button>
                </div>
                
                {selectedEquipment.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Nenhum equipamento selecionado. Clique em "Adicionar Equipamento" para começar.
                  </div>
                )}
                
                {selectedEquipment.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <select
                        value={item.equipmentId}
                        onChange={(e) => updateEquipment(index, 'equipmentId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Selecione um equipamento</option>
                        {equipment.map(equip => (
                          <option key={equip.id} value={equip.id}>
                            {equip.name} {equip.brand && equip.model && `(${equip.brand} ${equip.model})`} - R$ {parseFloat(equip.pricePerUnit.toString()).toFixed(2)}/unidade
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        placeholder="Quantidade"
                        value={item.qty || ''}
                        onChange={(e) => updateEquipment(index, 'qty', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        min="1"
                      />
                    </div>
                    <div className="w-32 text-sm text-gray-600">
                      {item.equipment && item.equipment.pricePerUnit ? `R$ ${(item.qty * parseFloat(item.equipment.pricePerUnit.toString())).toFixed(2)}` : '-'}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEquipment(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Verificação de Disponibilidade - Removida */}
               <div className="border-t pt-6">
                 <h4 className="text-lg font-medium text-gray-900 mb-4">Verificação de Disponibilidade</h4>
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                   <p className="text-blue-800 text-sm">
                     A verificação de disponibilidade agora é feita através da tela dedicada "Verificar Disponibilidade" no menu principal.
                   </p>
                   <Link 
                     href="/dashboard/verificar-disponibilidade" 
                     className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                   >
                     Ir para Verificação de Disponibilidade →
                   </Link>
                 </div>
               </div>

               <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingBooking(null)
                            setFormData({
          clientId: '',
          startDate: '',
          endDate: '',
          eventTitle: '',
          eventAddress: '',
          totalValue: '',
          status: 'PENDING',
          paymentStatus: 'PENDING'
        })
                    setSelectedProducts([])
                    setSelectedAccessories([])
                    setSelectedEquipment([])
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>

                                                 <button
                  type="submit"
                  disabled={isChecking}
                  className="px-4 py-2 rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed"
                >
                  {editingBooking ? 'Atualizar' : 'Criar'} Locação
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bookings List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Endereço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="text-blue-600" size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{booking.eventTitle}</div>
                          <div className="text-sm text-gray-500">R$ {booking.totalValue ? parseFloat(booking.totalValue.toString()).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.client.name}</div>
                      <div className="text-sm text-gray-500">{booking.client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.startDate).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-sm text-gray-500">
                        até {new Date(booking.endDate).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin size={14} className="mr-1" />
                        {booking.eventAddress}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status === 'CONFIRMED' && 'Confirmado'}
                        {booking.status === 'PENDING' && 'Pendente'}
                        {booking.status === 'RETURNED' && 'Retornado'}
                        {booking.status === 'CANCELLED' && 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus === 'PAID' && 'Pago'}
                        {booking.paymentStatus === 'PENDING' && 'Pendente'}
                        {booking.paymentStatus === 'PARTIAL' && 'Parcial'}
                        {booking.paymentStatus === 'OVERDUE' && 'Atrasado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewContract(booking.id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                        title="Visualizar contrato"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(booking)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Editar locação"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Deletar locação"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calendar size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma locação encontrada</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Tente ajustar os termos de busca.' : 'Comece criando sua primeira locação.'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Contract Viewer Modal */}
      {showContract && selectedBooking && companySettings && (
        <ContractViewer
          booking={selectedBooking}
          companySettings={companySettings}
          isOpen={showContract}
          onClose={() => {
            setShowContract(false)
            setSelectedBooking(null)
          }}
        />
      )}

      {/* Confirm Modal */}
      {ConfirmModal}
    </div>
  )
}
