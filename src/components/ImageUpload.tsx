'use client'

import { useState, useRef } from 'react'
import { Upload, X, Camera } from 'lucide-react'

interface ImageUploadProps {
  currentImage?: string
  onImageChange: (imageFile: File | null) => void
  alt: string
}

export default function ImageUpload({ currentImage, onImageChange, alt }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
        onImageChange(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const removeImage = () => {
    setPreview(null)
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : preview 
              ? 'border-gray-300' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt={alt}
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Camera className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Arraste uma imagem aqui ou{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  clique para selecionar
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG até 5MB
              </p>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
          className="hidden"
        />
      </div>
    </div>
  )
}
