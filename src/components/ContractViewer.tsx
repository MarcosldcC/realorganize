'use client'

import React, { useState } from 'react'
import { Download, Printer, X, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/Toast'

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
}

interface CompanySetting {
  name: string
  document: string
  email: string
  phone: string
  address: string
  logoUrl?: string
}

interface ContractViewerProps {
  booking: Booking
  companySettings: CompanySetting
  isOpen: boolean
  onClose: () => void
}

export default function ContractViewer({ booking, companySettings, isOpen, onClose }: ContractViewerProps) {
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const { showToast } = useToast()

  if (!isOpen) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch (error) {
      return dateString
    }
  }

  const calculateSubtotal = () => {
    let subtotal = 0
    
    // Calcular produtos
    booking.items.forEach(item => {
      if (item.product && item.product.pricePerMeter && item.meters) {
        subtotal += item.meters * parseFloat(item.product.pricePerMeter.toString())
      }
    })
    
    // Calcular acessórios
    booking.accessories.forEach(item => {
      if (item.accessory && item.accessory.pricePerUnit && item.qty) {
        subtotal += item.qty * parseFloat(item.accessory.pricePerUnit.toString())
      }
    })
    
    return subtotal
  }

  const validateContractData = () => {
    const errors: string[] = []

    // Validar dados do cliente
    if (!booking.client?.name?.trim()) {
      errors.push('Nome do cliente')
    }
    if (!booking.client?.email?.trim()) {
      errors.push('Email do cliente')
    }

    // Validar dados do evento
    if (!booking.eventTitle?.trim()) {
      errors.push('Título do evento')
    }
    if (!booking.eventAddress?.trim()) {
      errors.push('Endereço do evento')
    }

    // Validar datas
    if (!booking.startDate || !booking.endDate) {
      errors.push('Datas de início e fim')
    }

    // Validar itens
    if (booking.items.length === 0 && booking.accessories.length === 0) {
      errors.push('Pelo menos um produto ou acessório')
    }

    // Validar dados da empresa
    if (!companySettings?.name?.trim()) {
      errors.push('Nome da empresa')
    }
    if (!companySettings?.cnpj?.trim()) {
      errors.push('CNPJ da empresa')
    }

    return errors
  }

  const handlePrint = () => {
    const errors = validateContractData()
    if (errors.length > 0) {
      showToast({
        type: 'error',
        title: 'Dados incompletos',
        message: `Não foi possível gerar o contrato. Verifique os dados obrigatórios: ${errors.join(', ')}.`
      })
      return
    }

    window.print()
  }

  const handleDownloadPDF = async () => {
    const errors = validateContractData()
    if (errors.length > 0) {
      showToast({
        type: 'error',
        title: 'Dados incompletos',
        message: `Não foi possível gerar o contrato. Verifique os dados obrigatórios: ${errors.join(', ')}.`
      })
      return
    }

    setGeneratingPDF(true)
    try {
      const response = await fetch('/api/contracts/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId: booking.id }),
      })
      
      if (response.ok) {
        const blob = await response.blob()
        
        // Verificar se o blob tem conteúdo
        if (blob.size === 0) {
          throw new Error('Arquivo gerado está vazio')
        }

        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
                 a.download = `contrato-${booking.eventTitle.replace(/[^a-z0-9]/gi, '_')}-${formatDate(booking.startDate)}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        showToast({
          type: 'success',
          title: 'Contrato exportado!',
          message: 'O contrato foi baixado com sucesso.'
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar PDF')
      }
    } catch (error) {
      console.error('Erro ao baixar PDF:', error)
      showToast({
        type: 'error',
        title: 'Erro ao exportar',
        message: error instanceof Error ? error.message : 'Erro ao baixar contrato'
      })
    } finally {
      setGeneratingPDF(false)
    }
  }

  const contractRef = React.useRef<HTMLDivElement>(null)
  const validationErrors = validateContractData()
  const hasErrors = validationErrors.length > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Contrato de Locação</h2>
          <div className="flex items-center space-x-2">
            {hasErrors && (
              <div className="flex items-center space-x-1 px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">Dados incompletos</span>
              </div>
            )}
            <button
              onClick={handlePrint}
              disabled={hasErrors}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={hasErrors ? 'Corrija os dados obrigatórios antes de imprimir' : 'Imprimir contrato'}
            >
              <Printer size={16} />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF || hasErrors}
              className="flex items-center space-x-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={hasErrors ? 'Corrija os dados obrigatórios antes de exportar' : 'Exportar contrato em PDF'}
            >
              <Download size={16} />
              <span>{generatingPDF ? 'Gerando...' : 'Exportar PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Validation Errors */}
        {hasErrors && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Não foi possível gerar o contrato. Verifique os dados obrigatórios da locação:
                </p>
                <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Contract Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]" ref={contractRef}>
          <div className="max-w-4xl mx-auto bg-white">
            {/* Header */}
            <div className="text-center mb-8">
              {companySettings.logoUrl && (
                <img
                  src={companySettings.logoUrl}
                  alt="Logo da empresa"
                  className="mx-auto mb-4 h-16"
                />
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{companySettings.name || 'Nome da empresa não informado'}</h1>
              <p className="text-gray-600">{companySettings.address || 'Endereço não informado'}</p>
              <p className="text-gray-600">
                CNPJ: {companySettings.cnpj || 'Não informado'} | 
                Tel: {companySettings.phone || 'Não informado'}
              </p>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">CONTRATO DE LOCAÇÃO</h2>
              <p className="text-gray-600">Contrato Nº {booking.id.slice(-8).toUpperCase()}</p>
            </div>

            {/* Contract Details */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Company Information */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">LOCADOR</h3>
                  <p className="text-gray-800 font-medium">{companySettings.name || 'Nome não informado'}</p>
                  <p className="text-gray-600">CNPJ: {companySettings.cnpj || 'Não informado'}</p>
                  <p className="text-gray-600">{companySettings.address || 'Endereço não informado'}</p>
                  <p className="text-gray-600">Tel: {companySettings.phone || 'Não informado'}</p>
                  <p className="text-gray-600">Email: {companySettings.email || 'Não informado'}</p>
                </div>

                {/* Client Information */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">LOCATÁRIO</h3>
                  <p className="text-gray-800 font-medium">{booking.client.name || 'Nome não informado'}</p>
                  {booking.client.company && <p className="text-gray-600">Empresa: {booking.client.company}</p>}
                  {booking.client.document && <p className="text-gray-600">Documento: {booking.client.document}</p>}
                  {booking.client.address && <p className="text-gray-600">{booking.client.address}</p>}
                  {booking.client.phone && <p className="text-gray-600">Tel: {booking.client.phone}</p>}
                  <p className="text-gray-600">Email: {booking.client.email || 'Não informado'}</p>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">DETALHES DO EVENTO</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">
                    <strong>Evento:</strong> {booking.eventTitle || 'Título não informado'}
                  </p>
                  <p className="text-gray-600">
                    <strong>Endereço:</strong> {booking.eventAddress || 'Endereço não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">
                    <strong>Data de Início:</strong> {booking.startDate ? formatDate(booking.startDate) : 'Não informado'}
                  </p>
                  <p className="text-gray-600">
                    <strong>Data de Fim:</strong> {booking.endDate ? formatDate(booking.endDate) : 'Não informado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">PRODUTOS E ACESSÓRIOS ALUGADOS</h3>
              
              {/* Products */}
              {booking.items.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">PRODUTOS</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Produto</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700 border-b">Código</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700 border-b">Metros</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700 border-b">Preço/m²</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700 border-b">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900 border-b">
                              {item.product?.name || 'Nome não informado'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 border-b text-center">
                              {item.product?.code || 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 border-b text-center">
                              {item.meters || 0} m²
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 border-b text-center">
                              {item.product?.pricePerMeter ? formatCurrency(parseFloat(item.product.pricePerMeter.toString())) : 'R$ 0,00'}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900 border-b text-center">
                              {item.product?.pricePerMeter && item.meters ? 
                                formatCurrency(item.meters * parseFloat(item.product.pricePerMeter.toString())) : 
                                'R$ 0,00'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Accessories */}
              {booking.accessories.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">ACESSÓRIOS</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">Acessório</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700 border-b">Código</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700 border-b">Quantidade</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700 border-b">Preço/Unidade</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700 border-b">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.accessories.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900 border-b">
                              {item.accessory?.name || 'Nome não informado'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 border-b text-center">
                              {item.accessory?.code || 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 border-b text-center">
                              {item.qty || 0} un
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 border-b text-center">
                              {item.accessory?.pricePerUnit ? formatCurrency(parseFloat(item.accessory.pricePerUnit.toString())) : 'R$ 0,00'}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900 border-b text-center">
                              {item.accessory?.pricePerUnit && item.qty ? 
                                formatCurrency(item.qty * parseFloat(item.accessory.pricePerUnit.toString())) : 
                                'R$ 0,00'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mensagem quando não há itens */}
              {booking.items.length === 0 && booking.accessories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum produto ou acessório especificado para esta locação.</p>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">RESUMO FINANCEIRO</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Status do Pagamento:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                    booking.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    booking.paymentStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.paymentStatus === 'PAID' ? 'PAGO' :
                     booking.paymentStatus === 'PENDING' ? 'PENDENTE' :
                     booking.paymentStatus === 'PARTIAL' ? 'PARCIAL' : 'ATRASADO'}
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Valor Total:</span>
                                            <span className="text-lg font-bold text-gray-900">{formatCurrency(booking.totalValue || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">TERMOS E CONDIÇÕES</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>1.</strong> O locatário se compromete a devolver todos os produtos e acessórios no mesmo estado em que foram recebidos.</p>
                <p><strong>2.</strong> Danos causados durante o período de locação serão de responsabilidade do locatário.</p>
                <p><strong>3.</strong> O não cumprimento dos prazos de pagamento acarretará em multa de 2% ao mês sobre o valor em atraso.</p>
                <p><strong>4.</strong> Este contrato foi celebrado em {formatDate(new Date().toISOString())} e permanecerá válido até a conclusão da locação.</p>
              </div>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">OBSERVAÇÕES</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-gray-700">{booking.notes}</p>
                </div>
              </div>
            )}

            {/* Signatures */}
            <div className="mt-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="border-t border-gray-300 pt-4 mt-8">
                    <p className="font-medium text-gray-900">{companySettings.name || 'Nome da empresa'}</p>
                    <p className="text-sm text-gray-600">Assinatura do Locador</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-gray-300 pt-4 mt-8">
                    <p className="font-medium text-gray-900">{booking.client.name || 'Nome do cliente'}</p>
                    <p className="text-sm text-gray-600">Assinatura do Locatário</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
