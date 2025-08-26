'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: (id: string) => removeToast(id)
    }
    
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts }: { toasts: ToastProps[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}

function Toast({ type, title, message, duration = 5000, onClose, id }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          titleColor: 'text-green-800',
          messageColor: 'text-green-600'
        }
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          titleColor: 'text-red-800',
          messageColor: 'text-red-600'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-600'
        }
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: <Info className="w-5 h-5 text-blue-500" />,
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-600'
        }
    }
  }

  const styles = getToastStyles()

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isLeaving ? 'translate-x-full opacity-0' : ''}
        max-w-sm w-full bg-white rounded-lg shadow-lg border p-4
        ${styles.bg}
        backdrop-blur-sm
      `}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles.titleColor}`}>
            {title}
          </p>
          {message && (
            <p className={`text-sm mt-1 ${styles.messageColor}`}>
              {message}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={handleClose}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all duration-300 ease-linear ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
          style={{
            width: isLeaving ? '0%' : '100%',
            transition: `width ${duration}ms linear`
          }}
        />
      </div>
    </div>
  )
}

// Componente de modal para confirmações
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning'
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: ToastType
}) {
  if (!isOpen) return null

  const getModalStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          buttonColor: 'bg-green-600 hover:bg-green-700'
        }
      case 'error':
        return {
          icon: <XCircle className="w-12 h-12 text-red-500" />,
          buttonColor: 'bg-red-600 hover:bg-red-700'
        }
      case 'warning':
        return {
          icon: <AlertCircle className="w-12 h-12 text-yellow-500" />,
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        }
      case 'info':
        return {
          icon: <Info className="w-12 h-12 text-blue-500" />,
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }

  const styles = getModalStyles()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            {styles.icon}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>
          
          <p className="text-gray-600 text-center mb-6">
            {message}
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`flex-1 px-4 py-2 text-white ${styles.buttonColor} rounded-lg transition-colors font-medium`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook para usar o modal de confirmação
export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'warning' as ToastType
  })

  const showConfirmModal = (modalConfig: {
    title: string
    message: string
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
    type?: ToastType
  }) => {
    setConfig(modalConfig)
    setIsOpen(true)
  }

  const hideConfirmModal = () => {
    setIsOpen(false)
  }

  return {
    showConfirmModal,
    hideConfirmModal,
    ConfirmModal: (
      <ConfirmModal
        isOpen={isOpen}
        onClose={hideConfirmModal}
        onConfirm={config.onConfirm}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        type={config.type}
      />
    )
  }
}
