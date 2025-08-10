"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateBook } from "@/app/actions/books"
import { toast } from "sonner"
import Image from "next/image"

interface EditBookFormProps {
  book: {
    id: string
    title: string
    author: string
    isbn?: string | null
    description?: string | null
    coverImage?: string | null
  }
  onSuccess: (updatedBook: any) => void
  onCancel: () => void
}

export function EditBookForm({ book, onSuccess, onCancel }: EditBookFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: book.title,
    author: book.author,
    isbn: book.isbn || "",
    description: book.description || "",
    coverImage: book.coverImage || "",
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateBook(book.id, formData)
      if (result.error) {
        setError(result.error)
        return
      }
      
      toast.success("Book updated successfully!")
      onSuccess(result.book)
    } catch (err) {
      setError("Failed to update book")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Book</CardTitle>
        <CardDescription>
          Update the book details below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            {formData.coverImage && (
              <div className="flex justify-center">
                <div className="relative h-48 w-32">
                  <Image
                    src={formData.coverImage}
                    alt={`Cover of ${formData.title}`}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              </div>
            )}
            
            <div className="grid gap-3">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => handleInputChange("author", e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={formData.isbn}
                onChange={(e) => handleInputChange("isbn", e.target.value)}
                placeholder="Enter ISBN number"
              />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter book description"
                rows={4}
              />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                type="url"
                value={formData.coverImage}
                onChange={(e) => handleInputChange("coverImage", e.target.value)}
                placeholder="https://example.com/cover-image.jpg"
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
            
            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Updating..." : "Update Book"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
