"use client"

import { useState, useCallback } from "react"
import { Search, Loader2, ImageIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ImageResult {
  title: string
  url: string
  thumbnail: string
  pageUrl: string
}

interface ImageSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  query?: string
  onSelect: (url: string) => void
}

export function ImageSearchDialog({
  open,
  onOpenChange,
  query: initialQuery,
  onSelect,
}: ImageSearchDialogProps) {
  const [query, setQuery] = useState(initialQuery || "")
  const [results, setResults] = useState<ImageResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) return

    setLoading(true)
    setError("")
    setResults([])
    setHasSearched(true)

    try {
      const res = await fetch(`/api/search-images?q=${encodeURIComponent(q)}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Search failed")
      }
      const data = await res.json()
      setResults(data.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed")
    } finally {
      setLoading(false)
    }
  }, [query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search Cover Images</DialogTitle>
          <DialogDescription>
            Search for book cover images on the web. Select one to use as the cover.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch()
            }}
            placeholder="Search for images..."
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        {!loading && hasSearched && results.length === 0 && !error && (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12" />
            <p className="text-sm">No images found. Try a different search term.</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {results.map((result, index) => (
              <button
                key={`${result.url}-${index}`}
                type="button"
                className="group relative aspect-[2/3] rounded-lg overflow-hidden border bg-muted hover:ring-2 hover:ring-primary transition-all"
                onClick={() => {
                  onSelect(result.url)
                  onOpenChange(false)
                }}
              >
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const img = e.currentTarget
                    img.style.display = "none"
                    const parent = img.parentElement
                    if (parent) {
                      const fallback = document.createElement("div")
                      fallback.className = "w-full h-full flex items-center justify-center"
                      fallback.innerHTML = `<svg class="h-8 w-8 text-muted-foreground" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`
                      parent.appendChild(fallback)
                    }
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate text-left">
                    {result.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          Images are sourced from web search results. Verify usage rights if needed.
        </p>
      </DialogContent>
    </Dialog>
  )
}
