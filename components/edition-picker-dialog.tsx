"use client"

import { useState, useEffect } from "react"
import { Loader2, Check, BookOpen } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface EditionDoc {
  key: string
  title: string
  covers?: number[]
  publishers?: string[]
  publish_date?: string
  number_of_pages?: number
  physical_format?: string
  isbn_10?: string[]
  isbn_13?: string[]
}

export interface SelectedEdition {
  title: string
  author: string
  isbn: string
  coverUrl: string
  description?: string
  publisher?: string
  publishDate?: string
}

interface EditionPickerDialogProps {
  isOpen: boolean
  onClose: () => void
  workId: string
  initialIsbn?: string
  authorName: string
  description?: string
  onSelect: (edition: SelectedEdition) => void
}

export function EditionPickerDialog({
  isOpen,
  onClose,
  workId,
  initialIsbn,
  authorName,
  description,
  onSelect,
}: EditionPickerDialogProps) {
  const [editions, setEditions] = useState<EditionDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [coverChoice, setCoverChoice] = useState<Record<string, number>>({})
  const [brokenCovers, setBrokenCovers] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!isOpen) return

    const fetchEditions = async () => {
      setLoading(true)
      setError("")
      setEditions([])
      setSelectedKey(null)
      setCoverChoice({})

      let docs: EditionDoc[] = []
      try {
        const res = await fetch(
          `https://openlibrary.org${workId}/editions.json?limit=50`
        )
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        docs = data.editions?.docs || data.docs || data.entries || []
        setEditions(docs)

        if (initialIsbn && docs.length > 0) {
          const match = docs.find(
            (e) =>
              e.isbn_13?.includes(initialIsbn) ||
              e.isbn_10?.includes(initialIsbn)
          )
          if (match) setSelectedKey(match.key)
        }
      } catch {
        setError("Could not load editions.")
      } finally {
        setLoading(false)
      }
    }

    fetchEditions()
  }, [isOpen, workId, initialIsbn])

  const activeCover = (edition: EditionDoc): number | undefined =>
    coverChoice[edition.key] ?? edition.covers?.[0]

  const handleSelect = (edition: EditionDoc) => {
    const coverId = activeCover(edition)
    onSelect({
      title: edition.title,
      author: authorName,
      isbn: edition.isbn_13?.[0] || edition.isbn_10?.[0] || "",
      coverUrl: coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : "",
      description: description || "",
      publisher: edition.publishers?.[0],
      publishDate: edition.publish_date,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Edition</DialogTitle>
          <DialogDescription>
            Multiple editions are available. Select the one you have.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && !loading && (
          <p className="text-sm text-red-600 text-center py-8">{error}</p>
        )}

        {!loading && !error && editions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No editions found.
          </p>
        )}

        {!loading && !error && editions.length > 0 && (
          <div className="space-y-3">
            {editions.map((edition) => {
              const coverId = activeCover(edition)
              const isSelected = selectedKey === edition.key
              const covers = edition.covers || []

              return (
                <div
                  key={edition.key}
                  className={`flex gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => setSelectedKey(edition.key)}
                >
                  <div className="shrink-0">
                    {coverId && !brokenCovers[`${edition.key}-${coverId}`] ? (
                      <img
                        src={`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`}
                        alt=""
                        className="w-12 h-16 object-cover rounded"
                        onError={() =>
                          setBrokenCovers((prev) => ({
                            ...prev,
                            [`${edition.key}-${coverId}`]: true,
                          }))
                        }
                      />
                    ) : (
                      <div className="w-12 h-16 bg-muted rounded flex items-center justify-center text-muted-foreground">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{edition.title}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                      {edition.publishers?.[0] && (
                        <span>{edition.publishers[0]}</span>
                      )}
                      {edition.publish_date && (
                        <span>{edition.publish_date}</span>
                      )}
                      {edition.physical_format && (
                        <span>{edition.physical_format}</span>
                      )}
                      {edition.number_of_pages && (
                        <span>{edition.number_of_pages}p</span>
                      )}
                    </div>
                    {(edition.isbn_13?.[0] || edition.isbn_10?.[0]) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ISBN: {edition.isbn_13?.[0] || edition.isbn_10?.[0]}
                      </p>
                    )}

                    {covers.length > 1 && (
                      <div className="flex gap-1 mt-2">
                        {covers.map((cid) => (
                          <button
                            key={cid}
                            type="button"
                            className={`shrink-0 w-7 h-9 rounded overflow-hidden border ${
                              coverId === cid ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setCoverChoice((prev) => ({
                                ...prev,
                                [edition.key]: cid,
                              }))
                            }}
                          >
                            <img
                              src={`https://covers.openlibrary.org/b/id/${cid}-S.jpg`}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-start pt-1">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelect(edition)
                      }}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Select
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
