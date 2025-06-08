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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                Author
              </label>
              <input
                type="text"
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">
                ISBN
              </label>
              <input
                type="text"
                id="isbn"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="coverUrl" className="block text-sm font-medium text-gray-700">
                Cover Image URL
              </label>
              <input
                type="url"
                id="coverUrl"
                value={formData.coverUrl}
                onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="collection" className="block text-sm font-medium text-gray-700">
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
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting || isPending ? "Adding..." : "Add Book"}
            </button>
          </form>
        </TabsContent>
        <TabsContent value="isbn">
          <div className="space-y-4">
            <div>
              <label htmlFor="isbn-lookup" className="block text-sm font-medium">
                Enter ISBN
              </label>
              <input
                type="text"
                id="isbn-lookup"
                value={isbnLookup}
                onChange={(e) => setIsbnLookup(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <button
              type="button"
              onClick={handleIsbnLookup}
              disabled={lookupLoading || !isbnLookup}
              className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {lookupLoading ? "Searching..." : "Search"}
            </button>
            {lookupError && <p className="text-red-500 text-sm">{lookupError}</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 