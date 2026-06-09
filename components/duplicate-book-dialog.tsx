"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CoverImage } from "@/components/cover-image"

interface ExistingBook {
  id: string
  title: string
  author: string
  isbn: string
  coverImage: string | null
  quantity: number
}

interface DuplicateBookDialogProps {
  type: "exact" | "edition"
  existingBook: ExistingBook
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddAnotherCopy: () => void
  onAddAnyway: () => void
  onCancel: () => void
}

export function DuplicateBookDialog({
  type,
  existingBook,
  open,
  onOpenChange,
  onAddAnotherCopy,
  onAddAnyway,
  onCancel,
}: DuplicateBookDialogProps) {
  if (!existingBook) return null

  const isExact = type === "exact"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isExact ? "Book Already in Library" : "Similar Book Found"}
          </DialogTitle>
          <DialogDescription>
            {isExact
              ? "You already have this book in your collection."
              : "You already have a book with the same title and author but a different ISBN."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-4 py-4">
          <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded">
            {existingBook.coverImage ? (
              <CoverImage
                src={existingBook.coverImage}
                alt={`Cover of ${existingBook.title}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                No cover
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-medium leading-tight">{existingBook.title}</p>
            <p className="text-sm text-muted-foreground">{existingBook.author}</p>
            {existingBook.isbn && (
              <p className="text-xs text-muted-foreground">
                ISBN: {existingBook.isbn}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              You have {existingBook.quantity} cop
              {existingBook.quantity !== 1 ? "ies" : "y"}
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {isExact ? (
            <Button onClick={onAddAnotherCopy}>
              Add Another Copy
            </Button>
          ) : (
            <Button onClick={onAddAnyway}>
              Add Anyway
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
