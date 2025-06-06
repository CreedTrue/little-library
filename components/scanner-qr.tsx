"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { io } from "socket.io-client"
import { useRouter } from "next/navigation"

interface BookData {
  title: string
  author: string
  isbn: string
  coverUrl?: string
  description?: string
}

export function ScannerQR() {
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<any>(null)
  const [sessionId, setSessionId] = useState<string>("")
  const [scannedBook, setScannedBook] = useState<BookData | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Generate a unique session ID
    const newSessionId = Math.random().toString(36).substring(2, 15)
    setSessionId(newSessionId)

    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_YOUR_DOMAIN || "http://localhost:3000", {
      path: "/api/socket",
    })

    socketInstance.on("connect", () => {
      console.log("Connected to socket server", socketInstance.id)
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from socket server")
      setIsConnected(false)
    })

    // Listen for scan-barcode events from the socket (from mobile)
    console.log("Listening for scan-barcode events")
    socketInstance.on("scan-barcode", async (data: { isbn: string }) => {
      console.log("Received scan-barcode event", data)
      const isbn = data.isbn
      try {
        const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`)
        if (!response.ok) {
          throw new Error("Book not found")
        }
        const bookData = await response.json()
        let authorName = "Unknown Author"
        if (bookData.authors?.[0]?.key) {
          const authorResponse = await fetch(`https://openlibrary.org${bookData.authors[0].key}.json`)
          if (authorResponse.ok) {
            const authorData = await authorResponse.json()
            authorName = authorData.name
          }
        }
        const formattedBook: BookData = {
          title: bookData.title || "Unknown Title",
          author: authorName,
          isbn: isbn,
          coverUrl: bookData.covers?.[0]
            ? `https://covers.openlibrary.org/b/id/${bookData.covers[0]}-L.jpg`
            : undefined,
          description: bookData.description?.value || bookData.description || undefined
        }
        setScannedBook(formattedBook)
      } catch (error) {
        console.error("Error fetching book data:", error)
        // Optionally show an error toast here
      }
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const handleAddBook = () => {
    if (scannedBook) {
      // Store the book data in localStorage to be picked up by the add book form
      localStorage.setItem("scannedBook", JSON.stringify(scannedBook))
      router.push("/books/add")
    }
  }

  const connectionUrl = `${window.location.origin}/scanner?session=${sessionId}`

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="rounded-lg border bg-card p-4">
        <QRCodeSVG value={connectionUrl} size={256} />
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-500">
          {isConnected ? "Scanner connected" : "Waiting for scanner..."}
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Scan this QR code with your phone to connect
        </p>
      </div>
      {scannedBook && (
        <div className="mt-4 w-full rounded-lg border bg-card p-4">
          <h3 className="font-semibold">{scannedBook.title}</h3>
          <p className="text-sm text-gray-500">by {scannedBook.author}</p>
          <p className="text-sm text-gray-500">ISBN: {scannedBook.isbn}</p>
          {scannedBook.coverUrl && (
            <img 
              src={scannedBook.coverUrl} 
              alt={`Cover of ${scannedBook.title}`}
              className="mt-2 h-32 w-auto object-contain"
            />
          )}
          <button
            onClick={handleAddBook}
            className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Add to Library
          </button>
        </div>
      )}
    </div>
  )
} 