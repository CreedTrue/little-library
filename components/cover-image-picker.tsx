"use client"

import { useState, useRef } from "react"
import { Upload, Search, ImageIcon, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageSearchDialog } from "./image-search-dialog"
import { compressImage } from "@/lib/compress-image"
import { toast } from "sonner"

interface CoverImagePickerProps {
  value: string
  onChange: (url: string) => void
  title?: string
}

export function CoverImagePicker({ value, onChange, title }: CoverImagePickerProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image too large (max 20MB)")
      return
    }

    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const formData = new FormData()
      formData.append("image", compressed, "cover.webp")

      const res = await fetch("/api/upload/cover", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }

      const data = await res.json()
      onChange(data.url)
      toast.success("Cover uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="relative h-24 w-16 shrink-0 rounded-lg overflow-hidden border bg-muted">
          {value ? (
            <img
              src={value}
              alt={title ? `Cover of ${title}` : "Cover preview"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange("")}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>

          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste an image URL..."
            className="text-sm"
          />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <ImageSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        query={title}
        onSelect={onChange}
      />
    </div>
  )
}
