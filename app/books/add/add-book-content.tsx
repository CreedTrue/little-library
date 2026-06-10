"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { addBook, checkDuplicateBook } from "@/app/actions/books"
import { getCollections } from "@/app/actions/collections"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import { io } from "socket.io-client"
import { CreateCollectionDialog } from "@/components/create-collection-dialog"
import { Label } from "@/components/ui/label"
import { CollectionSelector } from "@/components/collection-selector"
import { EditionPickerDialog, type SelectedEdition } from "@/components/edition-picker-dialog"
import { CoverImagePicker } from "@/components/cover-image-picker"
import { DuplicateBookDialog } from "@/components/duplicate-book-dialog"
import { QRCodeSVG } from "qrcode.react"

interface BookData {
  title: string
  author: string
  isbn: string
  coverUrl?: string
  description?: string
}

interface SearchResult {
  title: string
  author: string
  isbn: string
  coverUrl?: string
  firstPublishYear?: number
  publishYear?: number
  publisher?: string
  editionCount?: number
  workKey?: string
  key: string
}

interface Collection {
  id: string
  name: string
  description?: string
}

export default function AddBookPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    description: "",
    coverUrl: "",
  })
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [editionPickerOpen, setEditionPickerOpen] = useState(false)
  const [pickerWorkId, setPickerWorkId] = useState("")
  const [pickerInitialIsbn, setPickerInitialIsbn] = useState("")
  const [pickerAuthorName, setPickerAuthorName] = useState("")
  const [pickerDescription, setPickerDescription] = useState("")
  const [tab, setTab] = useState("search")
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<any>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false)
  const [scannerConnected, setScannerConnected] = useState(false)
  const [sessionId, setSessionId] = useState("")
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicateType, setDuplicateType] = useState<"exact" | "edition">("exact")
  const [duplicateExistingBook, setDuplicateExistingBook] = useState<any>(null)
  const [pendingSubmit, setPendingSubmit] = useState(false)
  const [origin, setOrigin] = useState("")

  // Debug logging for state changes
  useEffect(() => {
    console.log("State changed - isConnected:", isConnected, "scannerConnected:", scannerConnected)
  }, [isConnected, scannerConnected])

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
      })
      setSelectedCollectionIds([])
      // Clear the stored data
      localStorage.removeItem("scannedBook")
    }
  }, [])

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const fetchCollections = async (newCollectionId?: string) => {
    const result = await getCollections()
    if (result.collections) {
      /** @ts-ignore */
      const transformedCollections = result.collections.map((collection) => ({
        ...collection,
        description: collection.description || undefined
      }));
      setCollections(transformedCollections)
      
      // If a new collection was created, automatically select it
      if (newCollectionId) {
        // If a new collection was created, automatically select it
        if (newCollectionId) {
          setSelectedCollectionIds(prev => [...prev, newCollectionId])
        }
      }
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [])

  useEffect(() => {
    // Get session ID from URL or generate a new one
    const newSessionId = searchParams.get("session") || Math.random().toString(36).substring(7)
    setSessionId(newSessionId)
    const sessionId = newSessionId
    
    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_YOUR_DOMAIN || window.location.origin, {
      path: "/api/socket",
      query: { sessionId },
    })

    socketInstance.on("connect", () => {
      console.log("Socket connected with ID:", socketInstance.id)
      console.log("Session ID:", sessionId)
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
      setScannerConnected(false)
    })

    // Listen for scanner device connection
    socketInstance.on("scanner-connected", () => {
      console.log("Received scanner-connected event")
      setScannerConnected(true)
    })

    socketInstance.on("scanner-disconnected", () => {
      console.log("Received scanner-disconnected event")
      setScannerConnected(false)
    })

    socketInstance.on("scan-barcode", async (data: { isbn: string } | string) => {
      console.log("Received scan-barcode event", data)
      console.log("Current session ID:", sessionId)
      console.log("Socket ID:", socketInstance.id)
      
      // Handle both object format and direct string format
      const isbn = typeof data === 'string' ? data : data.isbn
      console.log("Processing ISBN:", isbn)
      
      // Show loading toast
      toast.loading("Searching for book information...")
      
      try {
        // Try the provided ISBN first
        let response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`)
        
        // If that fails and it's a converted ISBN-13, try the original UPC-A
        if (!response.ok && isbn.startsWith('978') && isbn.length === 13) {
          const originalUpc = isbn.substring(3, 12) // Remove 978 prefix and check digit
          console.log("Trying original UPC-A:", originalUpc)
          response = await fetch(`https://openlibrary.org/isbn/${originalUpc}.json`)
        }
        
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
        })
        setSelectedCollectionIds([])
        setTab("manual")
        toast.dismiss()
        toast.success("Book data loaded from scanner!")
      } catch (error) {
        console.error("Error fetching book data:", error)
        toast.dismiss()
        toast.error("Failed to fetch book data")
      }
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [searchParams])

  const executeAddBook = async (incrementQuantityOf?: string) => {
    setIsSubmitting(true)

    startTransition(async () => {
      try {
        const { coverUrl, ...rest } = formData;
        const result = await addBook({
          ...rest,
          coverImage: formData.coverUrl,
          collectionIds: selectedCollectionIds,
          incrementQuantityOf,
        })
        if (result && result.error) {
          toast("Failed to add book", { description: result.error })
          setIsSubmitting(false)
          return
        }
        toast.success("Book added successfully!")
        setFormData({
          title: "",
          author: "",
          isbn: "",
          description: "",
          coverUrl: "",
        })
        setSelectedCollectionIds([])
        setIsSubmitting(false)
      } catch (error) {
        console.error("Error adding book:", error)
        toast.error("Failed to add book", { description: "An error occurred while saving." })
        setIsSubmitting(false)
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (isCollectionDialogOpen) {
      return
    }

    setIsSubmitting(true)

    const duplicateResult = await checkDuplicateBook({
      title: formData.title,
      author: formData.author,
      isbn: formData.isbn,
    })

    if (duplicateResult.error) {
      toast("Failed to check for duplicates", { description: duplicateResult.error })
      setIsSubmitting(false)
      return
    }

    if (duplicateResult.type === "exact") {
      setDuplicateType("exact")
      setDuplicateExistingBook(duplicateResult.existingBook)
      setDuplicateDialogOpen(true)
      setPendingSubmit(true)
      setIsSubmitting(false)
      return
    }

    if (duplicateResult.type === "edition") {
      setDuplicateType("edition")
      setDuplicateExistingBook(duplicateResult.existingBook)
      setDuplicateDialogOpen(true)
      setPendingSubmit(true)
      setIsSubmitting(false)
      return
    }

    executeAddBook()
  }

  const handleAddAnotherCopy = () => {
    setDuplicateDialogOpen(false)
    setPendingSubmit(false)
    executeAddBook(duplicateExistingBook.id)
  }

  const handleAddAnyway = () => {
    setDuplicateDialogOpen(false)
    setPendingSubmit(false)
    executeAddBook()
  }

  const handleDuplicateCancel = () => {
    setDuplicateDialogOpen(false)
    setPendingSubmit(false)
    setIsSubmitting(false)
  }

  const handleSearch = async () => {
    const query = searchQuery.trim()
    if (!query) return
    setEditionPickerOpen(false)
    setSearchLoading(true)
    setSearchError("")
    setSearchResults([])
    setHasSearched(true)
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`
      )
      if (!response.ok) throw new Error("Search failed")
      const data = await response.json()
      type OpenLibraryDoc = {
        title?: string; author_name?: string[]; isbn?: string[]; cover_i?: number; first_publish_year?: number; publish_year?: number[]; publisher?: string[]; edition_count?: number; seed?: string[]; key: string
      }
      const results: SearchResult[] = (data.docs || []).map((doc: OpenLibraryDoc) => ({
        title: doc.title || "Unknown Title",
        author: doc.author_name?.[0] || "Unknown Author",
        isbn: doc.isbn?.[0] || "",
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : undefined,
        firstPublishYear: doc.first_publish_year,
        publishYear: doc.publish_year?.[0],
        publisher: doc.publisher?.[0],
        editionCount: doc.edition_count,
        workKey: doc.seed?.find((s: string) => s.startsWith("/works/")),
        key: doc.key,
      }))
      setSearchResults(results)
    } catch {
      setSearchError("Search failed. Please try again.")
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSelectResult = async (result: SearchResult) => {
    setFormData({
      title: result.title,
      author: result.author,
      isbn: result.isbn,
      description: "",
      coverUrl: result.coverUrl || "",
    })
    setSelectedCollectionIds([])

    toast.loading("Fetching book details...")
    try {
      let description = ""
      let authorName = result.author
      let workKey: string | undefined = result.workKey

      // Source 1: ISBN API
      if (result.isbn) {
        const response = await fetch(`https://openlibrary.org/isbn/${result.isbn}.json`)
        if (response.ok) {
          const bookData = await response.json()
          workKey = bookData.works?.[0]?.key || workKey

          if (bookData.authors?.[0]?.key) {
            const authorResponse = await fetch(`https://openlibrary.org${bookData.authors[0].key}.json`)
            if (authorResponse.ok) {
              const authorData = await authorResponse.json()
              authorName = authorData.name
            }
          }

          setFormData({
            title: result.title,
            author: authorName,
            isbn: result.isbn,
            description,
            coverUrl: bookData.covers?.[0]
              ? `https://covers.openlibrary.org/b/id/${bookData.covers[0]}-L.jpg`
              : result.coverUrl || "",
          })
        }
      }

      if (!workKey && result.key) {
        if (result.key.startsWith("/works/")) {
          workKey = result.key
        } else {
          const editionResponse = await fetch(`https://openlibrary.org${result.key}.json`)
          if (editionResponse.ok) {
            const editionData = await editionResponse.json()
            workKey = editionData.works?.[0]?.key
          }
        }
      }

      if (workKey) {
        const workResponse = await fetch(`https://openlibrary.org${workKey}.json`)
        if (workResponse.ok) {
          const workData = await workResponse.json()
          description = workData.description?.value || workData.description || ""
        }
        setFormData(prev => ({ ...prev, description }))
      }

      if (workKey) {
        setPickerWorkId(workKey)
        setPickerInitialIsbn(result.isbn)
        setPickerAuthorName(authorName)
        setPickerDescription(description)
        setEditionPickerOpen(true)
        toast.dismiss()
        return
      }

      toast.dismiss()
      toast.success("Book data loaded!")
    } catch {
      toast.dismiss()
    }
    setTab("manual")
  }

  const handleEditionPick = (edition: SelectedEdition) => {
    setFormData({
      title: edition.title,
      author: edition.author,
      isbn: edition.isbn,
      description: edition.description || "",
      coverUrl: edition.coverUrl,
    })
    setSelectedCollectionIds([])
    toast.success("Book data loaded!")
    setTab("manual")
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-3xl font-bold">Add New Book</h1>
      {scannerConnected ? (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded-md">
          Scanner connected - Ready to scan books
        </div>
      ) : isConnected ? (
        <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded-md">
          Waiting for scanner - Scan the QR code with your phone to connect a scanner
        </div>
      ) : (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded-md">
          Connecting to scanner service...
        </div>
      )}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="search">Search Books</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>
        <TabsContent value="search">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <label htmlFor="searchQuery" className="block text-sm font-medium mb-2">
                    Search Books
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="searchQuery"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder="Search by title, author, or ISBN..."
                    />
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={searchLoading}
                      className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      {searchLoading ? "Searching..." : "Search"}
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4 flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-500 mb-2">Scan to connect Phone</p>
                  <QRCodeSVG
                    value={`${origin}/scanner?session=${sessionId}`}
                    size={120}
                  />
                </div>
            </div>
            {searchError && (
                <p className="mt-2 text-sm text-red-600">{searchError}</p>
              )}
            {hasSearched && searchResults.length === 0 && !searchLoading && (
              <p className="text-sm text-gray-500">No results found</p>
            )}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                </p>
                {searchResults.map((result, index) => (
                  <div
                    key={result.key || index}
                    className="flex items-center gap-4 rounded-lg border p-3"
                  >
                    {result.coverUrl ? (
                      <img
                        src={result.coverUrl}
                        alt={`Cover of ${result.title}`}
                        className="h-16 w-12 object-cover rounded"
                      />
                    ) : (
                      <div className="h-16 w-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                        No cover
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      <p className="text-sm text-gray-500">{result.author}</p>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                        {result.publisher && <span>{result.publisher}</span>}
                        {result.publishYear && <span>{result.publishYear}</span>}
                        {!result.publishYear && result.firstPublishYear && (
                          <span>First published: {result.firstPublishYear}</span>
                        )}
                      </div>
                      {result.editionCount && result.editionCount > 1 && (
                        <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                          {result.editionCount} editions
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary/90"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
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
                <label className="block text-sm font-medium mb-1">
                  Cover Image
                </label>
                <CoverImagePicker
                  value={formData.coverUrl}
                  onChange={(url) => setFormData({ ...formData, coverUrl: url })}
                  title={formData.title}
                />
              </div>
              <div className="space-y-2">
                <Label>Collections</Label>
                <CollectionSelector
                  collections={collections}
                  selectedCollectionIds={selectedCollectionIds}
                  onSelectionChange={setSelectedCollectionIds}
                />
                <div className="mt-2">
                  <CreateCollectionDialog
                    onCollectionCreated={fetchCollections}
                    onOpenChange={setIsCollectionDialogOpen}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || isPending}
                className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting || isPending ? "Adding..." : "Add Book"}
              </button>
            </form>
          </div>
        </TabsContent>
      </Tabs>

      <EditionPickerDialog
        isOpen={editionPickerOpen}
        onClose={() => setEditionPickerOpen(false)}
        workId={pickerWorkId}
        initialIsbn={pickerInitialIsbn}
        authorName={pickerAuthorName}
        description={pickerDescription}
        onSelect={handleEditionPick}
      />

      <DuplicateBookDialog
        type={duplicateType}
        existingBook={duplicateExistingBook}
        open={duplicateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDuplicateCancel()
          }
        }}
        onAddAnotherCopy={handleAddAnotherCopy}
        onAddAnyway={handleAddAnyway}
        onCancel={handleDuplicateCancel}
      />
    </div>
  )
}
