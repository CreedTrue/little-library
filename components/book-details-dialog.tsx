"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RatingForm } from "@/components/rating-form"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { removeBook } from "@/app/actions/books"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface BookDetailsDialogProps {
  book: {
    id: string
    title: string
    author: string
    isbn?: string | null
    description?: string | null
    coverImage?: string | null
    averageRating: number | null
    collections?: {
      id: string
      name: string
    }[]
  }
  isOpen: boolean
  onClose: () => void
}

export function BookDetailsDialog({ book, isOpen, onClose }: BookDetailsDialogProps) {
  const [isRemoving, setIsRemoving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const router = useRouter()

  const handleRemove = async () => {
    setIsRemoving(true)
    try {
      const result = await removeBook(book.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Book removed from library")
      onClose()
      router.refresh()
    } catch (error) {
      toast.error("Failed to remove book")
    } finally {
      setIsRemoving(false)
      setShowConfirmDialog(false)
    }
  }

  return (
    <>
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
              {book.collections && book.collections.length > 0 && (
                <div>
                  <h3 className="font-semibold">Collections</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {book.collections.map((collection) => (
                      <span
                        key={collection.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {collection.name}
                      </span>
                    ))}
                  </div>
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
              <div className="pt-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isRemoving}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isRemoving ? "Removing..." : "Remove from Library"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleRemove}
        title="Remove Book"
        description={`Are you sure you want to remove "${book.title}" from your library? This action cannot be undone.`}
        confirmText="Remove Book"
        cancelText="Cancel"
      />
    </>
  )
} 