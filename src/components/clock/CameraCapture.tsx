// src/components/clock/CameraCapture.tsx
'use client'

import { useRef, useState, useCallback } from 'react'
import { Camera, RotateCcw, Check, X } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob | null) => void
  onClose: () => void
  allowSkip?: boolean
}

export default function CameraCapture({ onCapture, onClose, allowSkip = true }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setStream(mediaStream)
      setError('')
    } catch (err) {
      setError('Unable to access camera. Please check permissions.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0)
      const imageData = canvas.toDataURL('image/jpeg')
      setCapturedImage(imageData)
    }
  }

  const handleConfirm = () => {
    if (capturedImage) {
      canvasRef.current?.toBlob((blob) => {
        onCapture(blob)
      }, 'image/jpeg')
    }
    stopCamera()
  }

  const handleRetake = () => {
    setCapturedImage(null)
    startCamera()
  }

  const handleSkip = () => {
    stopCamera()
    onCapture(null)
  }

  // Start camera on mount
  useState(() => {
    startCamera()
    return () => stopCamera()
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-medium max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-border">
          <h3 className="text-lg font-semibold text-brand-text">Take Photo</h3>
          <button onClick={onClose} className="p-2 hover:bg-brand-background rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black aspect-[4/3]">
          {error ? (
            <div className="flex items-center justify-center h-full text-white">
              <p>{error}</p>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3">
          {!capturedImage ? (
            <div className="flex justify-center gap-4">
              <button
                onClick={capturePhoto}
                disabled={isLoading || !!error}
                className="w-16 h-16 bg-white rounded-full shadow-medium flex items-center justify-center hover:shadow-lg transition-shadow disabled:opacity-50"
              >
                <Camera className="w-8 h-8 text-brand-primary" />
              </button>
              {allowSkip && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 text-brand-text-secondary hover:text-brand-text font-medium"
                >
                  Skip
                </button>
              )}
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-6 py-3 bg-brand-background rounded-xl hover:bg-brand-border transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-primary-hover transition-colors"
              >
                <Check className="w-5 h-5" />
                Use Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}