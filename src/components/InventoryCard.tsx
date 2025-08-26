'use client'

import { Edit, Trash2, Package, Wrench, Cable, AlertTriangle } from 'lucide-react'

interface InventoryCardProps {
  item: any
  onEdit: (item: any) => void
  onDelete: (item: any) => void
  getItemTypeColor: (item: any) => string
  getItemIcon: (item: any) => React.ReactNode
  getItemTypeName: (item: any) => string
  formatQuantity: (item: any) => string
  formatPrice: (item: any) => string
  getTotalValue: (item: any) => number
  isLowStock?: (item: any) => boolean
}

export default function InventoryCard({
  item,
  onEdit,
  onDelete,
  getItemTypeColor,
  getItemIcon,
  getItemTypeName,
  formatQuantity,
  formatPrice,
  getTotalValue,
  isLowStock
}: InventoryCardProps) {
  const color = getItemTypeColor(item)
  const isLowStockItem = isLowStock ? isLowStock(item) : false

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden ${
      isLowStockItem ? 'border-red-200 bg-red-50' : ''
    }`}>
      {/* Header */}
      <div className={`p-4 bg-${color}-50 border-b border-${color}-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${color}-100`}>
              <div className={`text-${color}-600`}>
                {getItemIcon(item)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
              <p className="text-xs text-gray-500">Código: {item.code}</p>
            </div>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${color}-100 text-${color}-800`}>
            {getItemTypeName(item)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Equipment specific info */}
        {item.type === 'equipment' && item.brand && item.model && (
          <div className="mb-3 text-xs text-gray-600">
            <p><span className="font-medium">Marca:</span> {item.brand}</p>
            <p><span className="font-medium">Modelo:</span> {item.model}</p>
            {item.category && (
              <p><span className="font-medium">Categoria:</span> {item.category}</p>
            )}
          </div>
        )}

        {/* Image placeholder */}
        <div className="mb-3 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className={`text-${color}-400`}>
              <Package className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Stock info */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Quantidade:</span>
            <span className={`text-sm font-medium ${
              isLowStockItem ? 'text-red-600' : 'text-gray-900'
            }`}>
              {formatQuantity(item)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Preço Unitário:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatPrice(item)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Valor Total:</span>
            <span className="text-sm font-bold text-gray-900">
              R$ {getTotalValue(item).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Low stock warning */}
        {isLowStockItem && (
          <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-700 font-medium">
                Estoque Baixo
              </span>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              item.isAvailable 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {item.isAvailable ? 'Disponível' : 'Indisponível'}
            </span>
            
            {/* Actions */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onEdit(item)}
                className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                title="Editar"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(item)}
                className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
