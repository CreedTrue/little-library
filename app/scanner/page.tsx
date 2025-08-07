"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Html5QrcodeScanner } from "html5-qrcode"
import { io } from "socket.io-client"

function ScannerPageContent() {
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
    const socketUrl = process.env.NEXT_PUBLIC_YOUR_DOMAIN || "http://192.168.1.100:3000"
    console.log("Scanner connecting to:", socketUrl, "with sessionId:", sessionId)
    
    const socket = io(socketUrl, {
        path: "/api/socket",
        query: { sessionId },
      })

    socket.on("connect", () => {
      console.log("Scanner connected to socket server with ID:", socket.id)
      console.log("Scanner session ID:", sessionId)
      setIsConnected(true)
      // Emit scanner-device event to identify this as a scanner device
      socket.emit("scanner-device")
    })

    socket.on("connect_error", (error) => {
      console.error("Scanner connection error:", error)
    })

    socket.on("disconnect", () => {
      console.log("Scanner disconnected from socket server")
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
        let isbn = decodedText.replace(/[^0-9X]/g, "")
        console.log("Scanned barcode:", decodedText, "Extracted ISBN:", isbn)
        
        // Handle UPC-A barcodes (12 digits) - convert to ISBN-13
        if (isbn.length === 12) {
          // For UPC-A, we need to handle it differently
          // Most books use 978 prefix, but some use 979
          // Let's try both common conversions
          const isbn13_978 = "978" + isbn.substring(0, 9) + calculateISBN13CheckDigit("978" + isbn.substring(0, 9))
          console.log("Converted UPC-A to ISBN-13 (978):", isbn13_978)
          
          // For now, let's also try the original UPC-A as-is for some books
          console.log("Original UPC-A:", isbn)
          
          // Use the 978 conversion as primary
          isbn = isbn13_978
        }
        
        if (isbn.length === 10 || isbn.length === 13) {
          setLastScanned(isbn)
          console.log("Emitting scan-barcode with ISBN:", isbn, "Session ID:", sessionId)
          socket.emit("scan-barcode", isbn)
          // Add haptic feedback if available
          if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(200)
          }
        } else {
          console.log("Invalid ISBN length:", isbn.length, "ISBN:", isbn)
        }
      }
      
      // Helper function to calculate ISBN-13 check digit
      function calculateISBN13CheckDigit(isbn12: string): string {
        let sum = 0
        for (let i = 0; i < 12; i++) {
          const digit = parseInt(isbn12[i])
          sum += digit * (i % 2 === 0 ? 1 : 3)
        }
        const checkDigit = (10 - (sum % 10)) % 10
        return checkDigit.toString()
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

export default function ScannerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScannerPageContent />
    </Suspense>
  )
} 