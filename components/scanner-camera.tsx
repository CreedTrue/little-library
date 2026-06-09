"use client"

import { useEffect, useRef, useState } from "react"
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
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const mountedRef = useRef(false)
  const cooldownRef = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onScanSuccessRef = useRef(onScanSuccess)
  const onScanErrorRef = useRef(onScanError)
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const [isScanning, setIsScanning] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  onScanSuccessRef.current = onScanSuccess
  onScanErrorRef.current = onScanError

  async function initCamera() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
    } catch {
      setCameraError("Camera access denied. Please allow camera access and refresh the page.")
      onScanErrorRef.current?.("Camera access denied")
      return false
    }
    return true
  }

  async function enumerateCameras() {
    try {
      const devices = await Html5Qrcode.getCameras()
      if (!mountedRef.current) return
      if (devices.length === 0) {
        setCameraError("No camera found on this device.")
        return
      }
      const mapped = devices.map((d, i) => ({ id: d.id, label: d.label || `Camera ${i + 1}` }))
      setCameras(mapped)
      setSelectedCamera(mapped[0].id)
    } catch {
      if (mountedRef.current) setCameraError("Failed to enumerate cameras.")
    }
  }

  async function startScanning(cameraId: string) {
    if (!cameraId) return

    const scanner = new Html5Qrcode("scanner-camera-viewfinder")
    scannerRef.current = scanner

    try {
      await scanner.start(
        cameraId,
        { fps, qrbox: { width: qrboxSize, height: qrboxSize }, aspectRatio },
        (decodedText) => {
          if (cooldownRef.current || !mountedRef.current) return
          cooldownRef.current = true
          setIsScanning(false)
          onScanSuccessRef.current(decodedText)

          resumeTimerRef.current = setTimeout(() => {
            if (mountedRef.current) setIsScanning(true)
            cooldownRef.current = false
            resumeTimerRef.current = null
          }, 2000)
        },
        () => {}
      )
      if (!mountedRef.current) return
      setIsScanning(true)
      setCameraError(null)

      const cap = scanner.getRunningTrackCameraCapabilities()
      if (cap.torchFeature().isSupported()) {
        setTorchAvailable(true)
      }
    } catch (err: any) {
      if (!mountedRef.current) return
      const msg = err?.toString() || "Failed to start camera."
      setCameraError(msg)
      onScanErrorRef.current?.(msg)
    }
  }

  async function stopScanning() {
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop() } catch {}
    }
    scannerRef.current = null
    setIsScanning(false)
    setTorchOn(false)
    setTorchAvailable(false)
  }

  async function toggleTorch() {
    if (!scannerRef.current) return
    try {
      const torch = scannerRef.current.getRunningTrackCameraCapabilities().torchFeature()
      await torch.apply(!torch.value())
      setTorchOn((prev) => !prev)
    } catch {
      // Torch toggle not supported
    }
  }

  async function switchCamera(cameraId: string) {
    await stopScanning()
    await startScanning(cameraId)
  }

  useEffect(() => {
    mountedRef.current = true
    ;(async () => {
      const granted = await initCamera()
      if (granted && mountedRef.current) {
        await enumerateCameras()
      }
    })()
    return () => {
      mountedRef.current = false
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      stopScanning()
    }
  }, [])

  useEffect(() => {
    if (!selectedCamera) return
    startScanning(selectedCamera)
    return () => {
      stopScanning()
    }
  }, [selectedCamera])

  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl bg-black">
      <div id="scanner-camera-viewfinder" className="relative aspect-video w-full" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: qrboxSize, height: qrboxSize }}>
          <div className="absolute left-0 top-0 h-8 w-8 border-l-3 border-t-3 border-white/80 rounded-tl-md" />
          <div className="absolute right-0 top-0 h-8 w-8 border-r-3 border-t-3 border-white/80 rounded-tr-md" />
          <div className="absolute bottom-0 left-0 h-8 w-8 border-b-3 border-l-3 border-white/80 rounded-bl-md" />
          <div className="absolute bottom-0 right-0 h-8 w-8 border-b-3 border-r-3 border-white/80 rounded-br-md" />
          {isScanning && (
            <div className="absolute left-1 right-1 h-0.5 animate-pulse bg-primary shadow-[0_0_8px_2px] shadow-primary scan-line" />
          )}
        </div>
      </div>

      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
          <div className="text-center text-white">
            <p className="text-sm">{cameraError}</p>
            <button
              onClick={async () => {
                setCameraError(null)
                const granted = await initCamera()
                if (granted && mountedRef.current) await enumerateCameras()
              }}
              className="mt-3 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 bg-black/60 px-4 py-3">
        {cameras.length > 1 && (
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="max-w-[160px] truncate rounded-md bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur-sm"
          >
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id} className="text-black">
                {cam.label}
              </option>
            ))}
          </select>
        )}

        {torchAvailable && (
          <button
            onClick={toggleTorch}
            className={`rounded-md px-3 py-1.5 text-sm backdrop-blur-sm ${
              torchOn ? "bg-yellow-500 text-black" : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {torchOn ? "Flash On" : "Flash"}
          </button>
        )}

        <div className="flex items-center gap-1.5 text-xs text-white/70">
          <span
            className={`inline-block h-2 w-2 rounded-full ${isScanning ? "bg-green-400" : "bg-red-400"}`}
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
