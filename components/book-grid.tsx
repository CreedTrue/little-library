"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { BookDetailsDialog } from "./book-details-dialog"

interface Book {
  id: string
  title: string
  author: string
  coverImage: string | null
  averageRating: number | null
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

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="flex flex-col">
            <CardHeader className="relative aspect-[2/3] p-0">
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
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleViewDetails(book)}
              >
                View Details
              </Button>
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
    </div>
  )
} 