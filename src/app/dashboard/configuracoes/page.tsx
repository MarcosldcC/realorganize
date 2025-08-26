'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Building, 
  Settings, 
  Save, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  User
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useToast } from '@/components/Toast'

interface CompanySettings {
  id: string
  name: string
  email: string
  phone: string
  address: string
  cnpj: string
}

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<CompanySettings>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    cnpj: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<CompanySettings | null>(null)
  
  const { showToast } = useToast()

  useEffect(() => {
    loadCompanySettings()
  }, [])

  const loadCompanySettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/company-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setOriginalSettings(data)
      } else {
        showToast({
          type: 'error',
          title: 'Erro ao carregar',
          message: 'Erro ao carregar configurações da empresa.'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      showToast({
        type: 'error',
        title: 'Erro ao carregar',
        message: 'Erro ao carregar configurações da empresa.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    
    // Verificar se houve mudanças
    if (originalSettings) {
      const changed = Object.keys(settings).some(key => 
        settings[key as keyof CompanySettings] !== originalSettings[key as keyof CompanySettings]
      )
      setHasChanges(changed)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Validar campos obrigatórios
      if (!settings.name.trim() || !settings.email.trim() || !settings.phone.trim() || !settings.address.trim()) {
        showToast({
          type: 'error',
          title: 'Campos obrigatórios',
          message: 'Todos os campos são obrigatórios.'
        })
        return
      }

      const response = await fetch('/api/company-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const result = await response.json()
        setOriginalSettings(settings)
        setHasChanges(false)
        
        showToast({
          type: 'success',
          title: 'Sucesso!',
          message: 'Configurações da empresa atualizadas com sucesso!'
        })

        // Recarregar configurações para garantir sincronização
        await loadCompanySettings()
      } else {
        const errorData = await response.json()
        showToast({
          type: 'error',
          title: 'Erro ao salvar',
          message: errorData.error || 'Erro ao salvar configurações.'
        })
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      showToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: 'Erro ao salvar configurações da empresa.'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings)
      setHasChanges(false)
      showToast({
        type: 'info',
        title: 'Alterações descartadas',
        message: 'As alterações foram descartadas e os valores originais restaurados.'
      })
    }
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
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações da Empresa</h1>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Card Principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Informações da Empresa</h2>
          </div>

          <div className="space-y-6">
            {/* Nome da Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                Nome da Empresa
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite o nome da sua empresa"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-500" />
                Email de Contato
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="contato@suaempresa.com"
              />
            </div>

                         {/* Telefone */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                 <Phone className="w-4 h-4 mr-2 text-gray-500" />
                 Telefone
               </label>
               <input
                 type="text"
                 value={settings.phone}
                 onChange={(e) => handleInputChange('phone', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 placeholder="(11) 99999-9999"
               />
             </div>

             {/* CNPJ */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                 <Building className="w-4 h-4 mr-2 text-gray-500" />
                 CNPJ
               </label>
               <input
                 type="text"
                 value={settings.cnpj}
                 onChange={(e) => handleInputChange('cnpj', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 placeholder="00.000.000/0000-00"
               />
             </div>

            {/* Endereço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                Endereço Completo
              </label>
              <textarea
                value={settings.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Rua, número, bairro, cidade - Estado, CEP"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              {hasChanges && (
                <div className="flex items-center space-x-2 text-yellow-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Você tem alterações não salvas</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Descartar Alterações
                </button>
              )}
              
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Informações Importantes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Importante sobre as Configurações
              </h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• As alterações aqui afetam o nome da empresa em todo o sistema</p>
                <p>• O título das páginas será atualizado automaticamente</p>
                <p>• As informações aparecerão em relatórios e contratos</p>
                <p>• Recomendamos usar o nome oficial da sua empresa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview das Alterações */}
        {hasChanges && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-900 mb-2">
                  Preview das Alterações
                </h3>
                                 <div className="text-sm text-green-800 space-y-1">
                   <p><strong>Nome:</strong> {settings.name}</p>
                   <p><strong>Email:</strong> {settings.email}</p>
                   <p><strong>Telefone:</strong> {settings.phone}</p>
                   <p><strong>CNPJ:</strong> {settings.cnpj}</p>
                   <p><strong>Endereço:</strong> {settings.address}</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
