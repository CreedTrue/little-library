"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Edit } from "lucide-react"
import { BookDetailsDialog } from "./book-details-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EditBookForm } from "./edit-book-form"
import { useRouter } from "next/navigation"
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

interface Collection {
  id: string
  name: string
  books: Book[]
}

interface CollectionScrollProps {
  collection: Collection
}

export function CollectionScroll({ collection }: CollectionScrollProps) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const router = useRouter()

  const handleViewDetails = (book: Book) => {
    setSelectedBook(book)
    setDialogOpen(true)
  }

  const handleEditBook = (book: Book) => {
    setEditingBook(book)
    setEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    setEditingBook(null)
    router.refresh()
  }

  const handleEditCancel = () => {
    setEditDialogOpen(false)
    setEditingBook(null)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{collection.name}</h2>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {collection.books.map((book) => (
          <div key={book.id} className="w-40 flex-shrink-0">
            <Card className="flex flex-col h-full">
              <CardHeader className="relative aspect-[3/4] p-0">
                {book.read && (
                  <div className="absolute top-1 right-1 z-10 bg-green-500 rounded-full p-0.5">
                    <CheckCircle2 className="w-3 h-3 text-white" />
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
                  <div className="w-full h-full bg-muted flex items-center justify-center rounded-t-lg">
                    <span className="text-xs text-muted-foreground">No cover</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-grow p-2">
                <h3 className="font-semibold text-sm line-clamp-2">{book.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{book.author}</p>
                {book.averageRating !== null && (
                  <div className="flex items-center mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs ml-1">{book.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-2 pt-0">
                <div className="flex gap-1 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={() => handleEditBook(book)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={() => handleViewDetails(book)}
                  >
                    View
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>

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
