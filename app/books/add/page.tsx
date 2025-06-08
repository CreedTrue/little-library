"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { addBook } from "@/app/actions/books"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"

interface BookData {
  title: string
  author: string
  isbn: string
  coverUrl?: string
  description?: string
}

export default function AddBookPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    description: "",
    coverUrl: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isbnLookup, setIsbnLookup] = useState("")
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState("")
  const [tab, setTab] = useState("manual")

  useEffect(() => {
    // Check for scanned book data
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
      setTab("manual")
      // Clear the stored data
      localStorage.removeItem("scannedBook")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    startTransition(async () => {
      try {
        const { coverUrl, ...rest } = formData;
        const result = await addBook({
          ...rest,
          coverImage: formData.coverUrl,
        })
        if (result && result.error) {
          toast("Failed to add book", { description: result.error })
          setIsSubmitting(false)
          return
        }
        toast.success("Book added successfully!")
        router.replace("/dashboard")
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
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                  required
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