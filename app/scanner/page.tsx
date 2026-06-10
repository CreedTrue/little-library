"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ScannerCamera } from "@/components/scanner-camera"
import { io, type Socket } from "socket.io-client"

function ScannerPageContent() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastScanned, setLastScanned] = useState("")
  const socketRef = useRef<Socket | null>(null)
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")

  useEffect(() => {
    if (!sessionId) return

    const socketUrl = process.env.NEXT_PUBLIC_YOUR_DOMAIN || window.location.origin
    const socket = io(socketUrl, {
      path: "/api/socket",
      query: { sessionId },
    })
    socketRef.current = socket

    socket.on("connect", () => {
      setIsConnected(true)
      socket.emit("scanner-device")
    })

    socket.on("connect_error", () => {
      setIsConnected(false)
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [sessionId])

  function calculateISBN13CheckDigit(isbn12: string): string {
    let sum = 0
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn12[i])
      sum += digit * (i % 2 === 0 ? 1 : 3)
    }
    const checkDigit = (10 - (sum % 10)) % 10
    return checkDigit.toString()
  }

  function handleScanSuccess(decodedText: string) {
    let isbn = decodedText.replace(/[^0-9X]/g, "")

    if (isbn.length === 12) {
      const isbn13_978 = "978" + isbn.substring(0, 9) + calculateISBN13CheckDigit("978" + isbn.substring(0, 9))
      isbn = isbn13_978
    }

    if (isbn.length === 10 || isbn.length === 13) {
      setLastScanned(isbn)
      if (typeof window !== "undefined" && window.navigator.vibrate) {
        window.navigator.vibrate(200)
      }
      socketRef.current?.emit("scan-barcode", isbn)
    }
  }

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
        <div className="rounded-lg bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isConnected ? "Connected to desktop" : "Connecting..."}
          </p>
          {lastScanned && (
            <p className="mt-2 text-sm text-green-600">
              Last scanned: {lastScanned}
            </p>
          )}
        </div>
      </div>
      <ScannerCamera
        onScanSuccess={handleScanSuccess}
        qrboxSize={250}
        fps={10}
      />
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
