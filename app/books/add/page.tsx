"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { addBook } from "@/app/actions/books"

interface BookData {
  title: string
  author: string
  isbn: string
  coverUrl?: string
  description?: string
}

export default function AddBookPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      })
      // Clear the stored data
      localStorage.removeItem("scannedBook")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await addBook(formData)
      router.push("/library")
    } catch (error) {
      console.error("Error adding book:", error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-3xl font-bold">Add New Book</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
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
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add Book"}
        </button>
      </form>
    </div>
  )
} 