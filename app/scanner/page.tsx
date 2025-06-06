"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Html5QrcodeScanner } from "html5-qrcode"
import { io } from "socket.io-client"

export default function ScannerPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState("")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")

  useEffect(() => {
    if (!sessionId) {
      console.error("No session ID provided")
      return
    }

    // Initialize socket connection
    const socket = io("https://38df-172-59-154-196.ngrok-free.app/",{
      path: "/api/socket",
    })

    socket.on("connect", () => {
      console.log("Connected to socket server")
      setIsConnected(true)
    })

    socket.on("disconnect", () => {
      console.log("Disconnected from socket server")
      setIsConnected(false)
    })

    // Only initialize scanner after permission is granted
    if (permissionGranted) {
      // Initialize barcode scanner
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          qrbox: { width: 250, height: 250 },
          fps: 10,
        },
        false
      )

      scanner.render(onScanSuccess, onScanError)
      setIsScanning(true)

      function onScanSuccess(decodedText: string) {
        // Extract ISBN from barcode
        const isbn = decodedText.replace(/[^0-9X]/g, "")
        if (isbn.length === 10 || isbn.length === 13) {
          setLastScanned(isbn)
          socket.emit("scan-barcode", isbn)
          // Add haptic feedback if available
          if (window.navigator.vibrate) {
            window.navigator.vibrate(200)
          }
        }
      }

      function onScanError(error: any) {
        console.warn(`Scan error: ${error}`)
        // Don't show every error to the user, only critical ones
        if (error.includes("Permission denied")) {
          setCameraError("Camera access denied. Please allow camera access and refresh the page.")
        }
      }

      return () => {
        scanner.clear()
        socket.disconnect()
      }
    }
  }, [sessionId, permissionGranted])

  // Ask for permission on mount
  useEffect(() => {
    async function requestPermission() {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true })
        setPermissionGranted(true)
      } catch (error) {
        setCameraError("Camera access denied. Please allow camera access and refresh the page.")
      }
    }
    requestPermission()
  }, [])

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Invalid session. Please scan the QR code again.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4">
      <div className="mb-4 w-full max-w-md">
        <div className="rounded-lg bg-white p-4 text-center">
          <p className="text-sm text-gray-600">
            {isConnected ? "Connected to desktop" : "Connecting..."}
          </p>
          {lastScanned && (
            <p className="mt-2 text-sm text-green-600">
              Last scanned: {lastScanned}
            </p>
          )}
          {cameraError && (
            <p className="mt-2 text-sm text-red-600">
              {cameraError}
            </p>
          )}
        </div>
      </div>
      <div id="reader" className="w-full max-w-md" />
      {!isScanning && !cameraError && (
        <div className="mt-4 text-center text-white">
          <p>Initializing camera...</p>
        </div>
      )}
    </div>
  )
} 