// src/components/ui/Modal.tsx
import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="modal-overlay absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`modal-content relative bg-white rounded-2xl shadow-medium w-full ${sizes[size]} p-6`}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-brand-text">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-brand-background rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-brand-text-secondary" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}