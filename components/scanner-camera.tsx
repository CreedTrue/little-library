"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"

interface ScannerCameraProps {
  onScanSuccess: (decodedText: string) => void
  onScanError?: (error: string) => void
  fps?: number
  qrboxSize?: number
  aspectRatio?: number
}

export function ScannerCamera({
  onScanSuccess,
  onScanError,
  fps = 10,
  qrboxSize = 250,
  aspectRatio = 1.777,
}: ScannerCameraProps) {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const [isScanning, setIsScanning] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)

  const requestPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      setHasPermission(true)
    } catch {
      setCameraError("Camera access denied. Please allow camera access and refresh the page.")
      onScanError?.("Camera access denied")
    }
  }, [onScanError])

  const getCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras()
      if (devices.length === 0) {
        setCameraError("No camera found on this device.")
        return
      }
      const mapped = devices.map((d) => ({ id: d.id, label: d.label || `Camera ${devices.indexOf(d) + 1}` }))
      setCameras(mapped)
      if (!selectedCamera) {
        setSelectedCamera(mapped[0].id)
      }
    } catch {
      setCameraError("Failed to enumerate cameras.")
    }
  }, [selectedCamera])

  const startScanning = useCallback(async () => {
    if (!selectedCamera || !hasPermission) return

    const config = {
      fps,
      qrbox: { width: qrboxSize, height: qrboxSize },
      aspectRatio,
    }

    const html5QrCode = new Html5Qrcode("scanner-camera-viewfinder")
    html5QrCodeRef.current = html5QrCode

    try {
      await html5QrCode.start(
        selectedCamera,
        config,
        (decodedText) => {
          onScanSuccess(decodedText)
        },
        () => {}
      )
      setIsScanning(true)
      setCameraError(null)

      const cap = html5QrCode.getRunningTrackCameraCapabilities()
      if (cap.torchFeature().isSupported()) {
        setTorchAvailable(true)
      }
    } catch (err: any) {
      const msg = err?.toString() || "Failed to start camera."
      setCameraError(msg)
      onScanError?.(msg)
    }
  }, [selectedCamera, hasPermission, fps, qrboxSize, aspectRatio, onScanSuccess, onScanError])

  const stopScanning = useCallback(async () => {
    if (html5QrCodeRef.current?.isScanning) {
      await html5QrCodeRef.current.stop()
      setIsScanning(false)
      setTorchOn(false)
      setTorchAvailable(false)
    }
  }, [])

  const toggleTorch = useCallback(async () => {
    if (!html5QrCodeRef.current) return
      try {
        const torch = html5QrCodeRef.current.getRunningTrackCameraCapabilities().torchFeature()
        await torch.apply(!torch.value())
        setTorchOn((prev) => !prev)
      } catch {
        // Torch toggle not supported
      }
  }, [])

  const switchCamera = useCallback(
    async (cameraId: string) => {
      if (isScanning) {
        await stopScanning()
      }
      setSelectedCamera(cameraId)
    },
    [isScanning, stopScanning]
  )

  useEffect(() => {
    requestPermission()
  }, [requestPermission])

  useEffect(() => {
    if (hasPermission) {
      getCameras()
    }
  }, [hasPermission, getCameras])

  useEffect(() => {
    if (hasPermission && selectedCamera) {
      startScanning()
    }
    return () => {
      stopScanning()
    }
  }, [hasPermission, selectedCamera, startScanning, stopScanning])

  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl bg-black">
      {/* Viewfinder container */}
      <div id="scanner-camera-viewfinder" className="relative aspect-video w-full" />

      {/* Scanning overlay -- corner brackets */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="relative"
          style={{ width: qrboxSize, height: qrboxSize }}
        >
          {/* Corner brackets */}
          <div className="absolute left-0 top-0 h-8 w-8 border-l-3 border-t-3 border-white/80 rounded-tl-md" />
          <div className="absolute right-0 top-0 h-8 w-8 border-r-3 border-t-3 border-white/80 rounded-tr-md" />
          <div className="absolute bottom-0 left-0 h-8 w-8 border-b-3 border-l-3 border-white/80 rounded-bl-md" />
          <div className="absolute bottom-0 right-0 h-8 w-8 border-b-3 border-r-3 border-white/80 rounded-br-md" />
          {/* Scanning line */}
          {isScanning && (
            <div className="absolute left-1 right-1 h-0.5 animate-pulse bg-primary shadow-[0_0_8px_2px] shadow-primary scan-line" />
          )}
        </div>
      </div>

      {/* Error overlay */}
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
          <div className="text-center text-white">
            <p className="text-sm">{cameraError}</p>
            <button
              onClick={() => {
                setCameraError(null)
                requestPermission()
              }}
              className="mt-3 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-3 bg-black/60 px-4 py-3">
        {/* Camera selector */}
        {cameras.length > 1 && (
          <select
            value={selectedCamera}
            onChange={(e) => switchCamera(e.target.value)}
            className="max-w-[160px] truncate rounded-md bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur-sm"
          >
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id} className="text-black">
                {cam.label}
              </option>
            ))}
          </select>
        )}

        {/* Torch toggle */}
        {torchAvailable && (
          <button
            onClick={toggleTorch}
            className={`rounded-md px-3 py-1.5 text-sm backdrop-blur-sm ${
              torchOn
                ? "bg-yellow-500 text-black"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {torchOn ? "Flash On" : "Flash"}
          </button>
        )}

        {/* Scan status indicator */}
        <div className="flex items-center gap-1.5 text-xs text-white/70">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isScanning ? "bg-green-400" : "bg-red-400"
            }`}
          />
          {isScanning ? "Scanning" : "Stopped"}
        </div>
      </div>

      <style>{`
        @keyframes scanMove {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
        .scan-line {
          animation: scanMove 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
