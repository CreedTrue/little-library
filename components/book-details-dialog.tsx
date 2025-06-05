"use client"

import Image from "next/image"
import { Star } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RatingForm } from "@/components/rating-form"

interface BookDetailsDialogProps {
  book: {
    id: string
    title: string
    author: string
    isbn?: string | null
    description?: string | null
    coverImage?: string | null
    averageRating: number | null
  }
  isOpen: boolean
  onClose: () => void
}

export function BookDetailsDialog({ book, isOpen, onClose }: BookDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{book.title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative aspect-[2/3] w-full max-w-[300px] mx-auto">
            {book.coverImage ? (
              <Image
                src={book.coverImage}
                alt={`Cover of ${book.title}`}
                fill
                className="object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
                <span className="text-muted-foreground">No cover</span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Author</h3>
              <p className="text-muted-foreground">{book.author}</p>
            </div>
            {book.isbn && (
              <div>
                <h3 className="font-semibold">ISBN</h3>
                <p className="text-muted-foreground">{book.isbn}</p>
              </div>
            )}
            {book.description && (
              <div>
                <h3 className="font-semibold">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {book.description}
                </p>
              </div>
            )}
            {book.averageRating !== null && (
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">
                  {book.averageRating.toFixed(1)}
                </span>
              </div>
            )}
            <RatingForm bookId={book.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 