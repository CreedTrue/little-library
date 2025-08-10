"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, Trash2, Edit, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RatingForm } from "@/components/rating-form"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EditBookForm } from "@/components/edit-book-form"
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
  const [isEditing, setIsEditing] = useState(false)
  const [currentBook, setCurrentBook] = useState(book)
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

  const handleEditSuccess = (updatedBook: any) => {
    setCurrentBook(updatedBook)
    setIsEditing(false)
    router.refresh()
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">{currentBook.title}</DialogTitle>
              <div className="flex gap-2">
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {isEditing ? (
            <EditBookForm
              book={currentBook}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative aspect-[2/3] w-full max-w-[300px] mx-auto">
                {currentBook.coverImage ? (
                  <Image
                    src={currentBook.coverImage}
                    alt={`Cover of ${currentBook.title}`}
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
                  <p className="text-muted-foreground">{currentBook.author}</p>
                </div>
                {currentBook.isbn && (
                  <div>
                    <h3 className="font-semibold">ISBN</h3>
                    <p className="text-muted-foreground">{currentBook.isbn}</p>
                  </div>
                )}
                {currentBook.collections && currentBook.collections.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Collections</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {currentBook.collections.map((collection) => (
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
                {currentBook.description && (
                  <div>
                    <h3 className="font-semibold">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {currentBook.description}
                    </p>
                  </div>
                )}
                {currentBook.averageRating !== null && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">
                      {currentBook.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
                <RatingForm bookId={currentBook.id} />
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
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleRemove}
        title="Remove Book"
        description={`Are you sure you want to remove "${currentBook.title}" from your library? This action cannot be undone.`}
        confirmText="Remove Book"
        cancelText="Cancel"
      />
    </>
  )
} 