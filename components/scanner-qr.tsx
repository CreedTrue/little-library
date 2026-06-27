"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { io } from "socket.io-client"
import { useRouter } from "next/navigation"
import { EditionPickerDialog, type SelectedEdition } from "@/components/edition-picker-dialog"

interface BookData {
  title: string
  author: string
  isbn: string
  coverUrl?: string
  description?: string
}

export function ScannerQR() {
  const [mounted, setMounted] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<any>(null)
  const [sessionId, setSessionId] = useState<string>("")
  const [scannedBook, setScannedBook] = useState<BookData | null>(null)
  const [scannedWorkId, setScannedWorkId] = useState<string | null>(null)
  const [editionPickerOpen, setEditionPickerOpen] = useState(false)
  const [showQR, setShowQR] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768) {
      setShowQR(false)
    }

    // Generate a unique session ID
    const newSessionId = Math.random().toString(36).substring(2, 15)
    setSessionId(newSessionId)

    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_YOUR_DOMAIN || window.location.origin, {
      path: "/api/socket",
      query: { sessionId: newSessionId },
    })

    socketInstance.on("connect", () => {
      console.log("Connected to socket server", socketInstance.id)
      setIsConnected(true)
    })

    // Listen for scanner device connection
    socketInstance.on("scanner-connected", () => {
      console.log("Scanner device connected to desktop")
      // Automatically route to add book page when scanner connects
      router.push(`/books/add?session=${newSessionId}`)
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
        let description = ""

        // Get the work ID and fetch description
        const workId = bookData.works?.[0]?.key
        if (workId) {
          const workResponse = await fetch(`https://openlibrary.org${workId}.json`)
          if (workResponse.ok) {
            const workData = await workResponse.json()
            description = workData.description?.value || workData.description || ""
          }
        }

        if (bookData.authors?.[0]?.key) {
          const authorResponse = await fetch(`https://openlibrary.org${bookData.authors[0].key}.json`)
          if (authorResponse.ok) {
            const authorData = await authorResponse.json()
            authorName = authorData.name
          }
        }
        const workKey = bookData.works?.[0]?.key || null

        const formattedBook: BookData = {
          title: bookData.title || "Unknown Title",
          author: authorName,
          isbn: isbn,
          coverUrl: bookData.covers?.[0]
            ? `https://covers.openlibrary.org/b/id/${bookData.covers[0]}-L.jpg`
            : undefined,
          description: description
        }
        setScannedBook(formattedBook)
        setScannedWorkId(workKey)
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

  const connectionUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/scanner?session=${sessionId}`
    : `/scanner?session=${sessionId}`

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Scan with Phone</h3>
          <p className="text-sm text-gray-500">Use your phone to scan book barcodes</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
          <span>QR Code</span>
          <input 
            type="checkbox" 
            checked={showQR} 
            onChange={(e) => setShowQR(e.target.checked)}
            className="cursor-pointer h-4 w-4 rounded border-gray-300"
          />
        </label>
      </div>
      {showQR ? (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-lg border bg-card p-4 flex justify-center">
            {mounted ? (
              <QRCodeSVG 
                value={connectionUrl} 
                size={200} 
                className="max-w-full h-auto"
              />
            ) : (
              <div className="h-[200px] w-[200px] max-w-full" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">
              {isConnected ? "Ready for scanner" : "Waiting for scanner..."}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Scan this QR code with your phone to connect
            </p>
            {isConnected && (
              <p className="mt-2 text-xs text-green-600">
                Desktop will automatically open add book page when scanner connects
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="my-6 flex flex-col items-center justify-center">
          <button
            onClick={() => router.push(`/scanner?session=${sessionId}&mode=step`)}
            className="w-full rounded-md bg-primary px-4 py-3 font-medium text-white hover:bg-primary/90"
          >
            Open Scanner
          </button>
        </div>
      )}
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
          {scannedWorkId && (
            <button
              onClick={() => setEditionPickerOpen(true)}
              className="mt-2 w-full rounded-md border border-primary px-4 py-2 text-sm text-primary hover:bg-primary/5"
            >
              Choose Edition
            </button>
          )}
        </div>
      )}

      <EditionPickerDialog
        isOpen={editionPickerOpen}
        onClose={() => setEditionPickerOpen(false)}
        workId={scannedWorkId || ""}
        initialIsbn={scannedBook?.isbn}
        authorName={scannedBook?.author || "Unknown"}
        description={scannedBook?.description}
        onSelect={(edition: SelectedEdition) => {
          setScannedBook({
            title: edition.title,
            author: edition.author,
            isbn: edition.isbn,
            coverUrl: edition.coverUrl || scannedBook?.coverUrl,
            description: edition.description || scannedBook?.description,
          })
          setEditionPickerOpen(false)
        }}
      />
    </div>
  )
} 