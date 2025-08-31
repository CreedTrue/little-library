"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Edit } from "lucide-react"
import { BookDetailsDialog } from "./book-details-dialog"
import { EditBookForm } from "./edit-book-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { CheckCircle2 } from "lucide-react"

interface Book {
  id: string
  title: string
  author: string
  coverImage: string | null
  averageRating: number | null
  read: boolean
  isbn?: string | null
  description?: string | null
}

interface BookGridProps {
  books: Book[]
  totalPages: number
  currentPage: number
}

export function BookGrid({ books, totalPages, currentPage }: BookGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const createQueryString = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      newParams.set(key, value)
    })
    return newParams.toString()
  }

  const handleViewDetails = (book: Book) => {
    setSelectedBook(book)
    setDialogOpen(true)
  }

  const handleEditBook = (book: Book) => {
    setEditingBook(book)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = (updatedBook: any) => {
    setEditDialogOpen(false)
    setEditingBook(null)
    
    // Update the book in the books array if it exists
    const updatedBooks = books.map(book => 
      book.id === updatedBook.id ? updatedBook : book
    )
    
    // Update the selected book if it's the same book
    if (selectedBook && selectedBook.id === updatedBook.id) {
      setSelectedBook(updatedBook)
    }
    
    router.refresh()
  }

  const handleEditCancel = () => {
    setEditDialogOpen(false)
    setEditingBook(null)
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="flex flex-col">
            <CardHeader className="relative aspect-[2/3] p-0">
              {book.read && (
                <div className="absolute top-2 right-2 z-10 bg-green-500 rounded-full p-1">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              )}
              {book.coverImage ? (
                <Image
                  src={book.coverImage}
                  alt={`Cover of ${book.title}`}
                  fill
                  className="object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No cover</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-grow p-4">
              <h3 className="font-semibold line-clamp-2">{book.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
              {book.averageRating !== null && (
                <div className="flex items-center mt-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm ml-1">{book.averageRating.toFixed(1)}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditBook(book)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleViewDetails(book)}
                >
                  View
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => {
              router.push(
                `/library?${createQueryString({ page: String(currentPage - 1) })}`
              )
            }}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => {
              router.push(
                `/library?${createQueryString({ page: String(currentPage + 1) })}`
              )
            }}
          >
            Next
          </Button>
        </div>
      )}
      
      {selectedBook && (
        <BookDetailsDialog
          book={selectedBook}
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      )}
      
      {editingBook && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Book: {editingBook.title}</DialogTitle>
            </DialogHeader>
            <EditBookForm
              book={editingBook}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 