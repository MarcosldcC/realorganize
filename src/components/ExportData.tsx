'use client'

import { useState } from 'react'
import { Download, FileText, Filter } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface ExportDataProps {
  data: any[]
  filename?: string
  columns: {
    key: string
    label: string
    formatter?: (value: any) => string
  }[]
  onExport?: (csvData: string) => void
}

export default function ExportData({ data, filename = 'export', columns, onExport }: ExportDataProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { showToast } = useToast()

  const formatValue = (value: any, formatter?: (value: any) => string) => {
    if (formatter) return formatter(value)
    if (value === null || value === undefined) return ''
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
    return String(value)
  }

  const generateCSV = () => {
    if (data.length === 0) {
      showToast({
        type: 'warning',
        title: 'Nenhum dado para exportar',
        message: 'Não há dados selecionados para exportação.'
      })
      return
    }

    setIsExporting(true)

    try {
      // Headers
      const headers = columns.map(col => `"${col.label}"`).join(',')
      
      // Data rows
      const rows = data.map(row => 
        columns.map(col => {
          const value = formatValue(row[col.key], col.formatter)
          return `"${value.replace(/"/g, '""')}"`
        }).join(',')
      )

      const csvContent = [headers, ...rows].join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      
      // Download file
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showToast({
        type: 'success',
        title: 'Exportação concluída',
        message: `${data.length} itens exportados com sucesso.`
      })

      if (onExport) onExport(csvContent)
    } catch (error) {
      console.error('Erro ao exportar dados:', error)
      showToast({
        type: 'error',
        title: 'Erro na exportação',
        message: 'Ocorreu um erro ao exportar os dados.'
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={generateCSV}
      disabled={isExporting || data.length === 0}
      className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      title="Exportar dados em CSV"
    >
      {isExporting ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span className="text-sm">
        {isExporting ? 'Exportando...' : 'Exportar'}
      </span>
    </button>
  )
}
