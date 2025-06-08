"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { addBook } from "@/app/actions/books"
import { getCollections } from "@/app/actions/collections"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import { io } from "socket.io-client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BookData {
  title: string
  author: string
  isbn: string
  coverUrl?: string
  description?: string
}

interface Collection {
  id: string
  name: string
  description?: string
}

export default function AddBookPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    description: "",
    coverUrl: "",
    collectionId: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isbnLookup, setIsbnLookup] = useState("")
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState("")
  const [tab, setTab] = useState("manual")
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<any>(null)
  const [collections, setCollections] = useState<Collection[]>([])

  useEffect(() => {
    // Check for scanned book data from dashboard
    const scannedBookData = localStorage.getItem("scannedBook")
    if (scannedBookData) {
      const book: BookData = JSON.parse(scannedBookData)
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        description: book.description || "",
        coverUrl: book.coverUrl || "",
        collectionId: "",
      })
      // Clear the stored data
      localStorage.removeItem("scannedBook")
    }
  }, [])

  useEffect(() => {
    // Fetch collections
    const fetchCollections = async () => {
      const result = await getCollections()
      if (result.collections) {
        setCollections(result.collections)
      }
    }
    fetchCollections()
  }, [])

  useEffect(() => {
    // Get session ID from URL or generate a new one
    const sessionId = searchParams.get("session") || Math.random().toString(36).substring(7)
    
    // Initialize socket connection
    const socketInstance = io({
      path: "/api/socket",
      query: { sessionId },
    })

    socketInstance.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

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

        setFormData({
          title: bookData.title || "Unknown Title",
          author: authorName,
          isbn: isbn,
          description: description,
          coverUrl: bookData.covers?.[0]
            ? `https://covers.openlibrary.org/b/id/${bookData.covers[0]}-L.jpg`
            : "",
          collectionId: "",
        })
        setTab("manual")
        toast.success("Book data loaded from scanner!")
      } catch (error) {
        console.error("Error fetching book data:", error)
        toast.error("Failed to fetch book data")
      }
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    startTransition(async () => {
      try {
        const { coverUrl, collectionId, ...rest } = formData;
        const result = await addBook({
          ...rest,
          coverImage: formData.coverUrl,
          collectionId: formData.collectionId || undefined,
        })
        if (result && result.error) {
          toast("Failed to add book", { description: result.error })
          setIsSubmitting(false)
          return
        }
        toast.success("Book added successfully!")
        // Reset form data
        setFormData({
          title: "",
          author: "",
          isbn: "",
          description: "",
          coverUrl: "",
          collectionId: "",
        })
        setIsSubmitting(false)
      } catch (error) {
        console.error("Error adding book:", error)
        toast.error("Failed to add book", { description: "An error occurred while saving." })
        setIsSubmitting(false)
      }
    })
  }

  const handleIsbnLookup = async () => {
    setLookupLoading(true)
    setLookupError("")
    try {
      const response = await fetch(`https://openlibrary.org/isbn/${isbnLookup}.json`)
      if (!response.ok) throw new Error("Book not found")
      const bookData = await response.json()
      let authorName = "Unknown Author"
      if (bookData.authors?.[0]?.key) {
        const authorResponse = await fetch(`https://openlibrary.org${bookData.authors[0].key}.json`)
        if (authorResponse.ok) {
          const authorData = await authorResponse.json()
          authorName = authorData.name
        }
      }
      setFormData({
        title: bookData.title || "Unknown Title",
        author: authorName,
        isbn: isbnLookup,
        description: bookData.description?.value || bookData.description || "",
        coverUrl: bookData.covers?.[0]
          ? `https://covers.openlibrary.org/b/id/${bookData.covers[0]}-L.jpg`
          : "",
        collectionId: "",
      })
      setTab("manual")
    } catch (err: any) {
      setLookupError("Book not found or error fetching data.")
    } finally {
      setLookupLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-3xl font-bold">Add New Book</h1>
      {isConnected && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded-md">
          Scanner connected - Ready to scan books
        </div>
      )}
      <Tabs value={tab} onValueChange={setTab} className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="isbn">ISBN Lookup</TabsTrigger>
        </TabsList>
        <TabsContent value="manual">
          <div className="flex flex-col md:flex-row gap-8">
            <form onSubmit={handleSubmit} className="flex-1 space-y-6" noValidate>
              <div>
                <label htmlFor="title" className="block text-sm font-medium">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="author" className="block text-sm font-medium">
                  Author
                </label>
                <input
                  type="text"
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="isbn" className="block text-sm font-medium">
                  ISBN
                </label>
                <input
                  type="text"
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="coverUrl" className="block text-sm font-medium">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  id="coverUrl"
                  value={formData.coverUrl}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label htmlFor="collection" className="block text-sm font-medium">
                  Collection
                </label>
                <Select
                  value={formData.collectionId}
                  onValueChange={(value) => setFormData({ ...formData, collectionId: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || isPending}
                className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting || isPending ? "Adding..." : "Add Book"}
              </button>
            </form>
            {formData.coverUrl && (
              <div className="flex-shrink-0 flex justify-center md:items-start md:mt-0 mt-8">
                <img
                  src={formData.coverUrl}
                  alt="Book cover"
                  className="h-64 w-auto object-contain border rounded shadow"
                />
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="isbn">
          <div className="space-y-4">
            <div>
              <label htmlFor="isbnLookup" className="block text-sm font-medium">
                ISBN
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  id="isbnLookup"
                  value={isbnLookup}
                  onChange={(e) => setIsbnLookup(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Enter ISBN..."
                />
                <button
                  type="button"
                  onClick={handleIsbnLookup}
                  disabled={lookupLoading}
                  className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {lookupLoading ? "Looking up..." : "Lookup"}
                </button>
              </div>
              {lookupError && (
                <p className="mt-2 text-sm text-red-600">{lookupError}</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 