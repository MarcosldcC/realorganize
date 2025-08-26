'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from './Toast'

interface DeleteBookingButtonProps {
  bookingId: string
  onDelete?: () => void
  className?: string
}

export default function DeleteBookingButton({ 
  bookingId, 
  onDelete, 
  className = '' 
}: DeleteBookingButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { showToast } = useToast()

  const handleDelete = async () => {
    if (!bookingId) return

    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Locação excluída',
          message: 'Locação excluída com sucesso e estoque restaurado automaticamente.'
        })
        
        setShowConfirmation(false)
        onDelete?.()
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Erro ao excluir',
          message: error.error || 'Erro ao excluir locação.'
        })
      }
    } catch (error) {
      console.error('Erro ao excluir locação:', error)
      showToast({
        type: 'error',
        title: 'Erro ao excluir',
        message: 'Erro ao excluir locação.'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (showConfirmation) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4" />
          <span>Confirmar exclusão?</span>
        </div>
        
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
          title="Confirmar exclusão"
        >
          {isDeleting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
        </button>
        
        <button
          onClick={() => setShowConfirmation(false)}
          disabled={isDeleting}
          className="p-1 text-gray-600 hover:text-gray-700 disabled:opacity-50"
          title="Cancelar"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirmation(true)}
      disabled={isDeleting}
      className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 ${className}`}
      title="Excluir locação"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
