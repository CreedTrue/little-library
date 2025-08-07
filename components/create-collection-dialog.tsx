"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createCollection } from "@/app/actions/collections"
import { toast } from "sonner"

interface CreateCollectionDialogProps {
  onCollectionCreated: (collectionId?: string) => void
  onOpenChange?: (open: boolean) => void
}

export function CreateCollectionDialog({ onCollectionCreated, onOpenChange }: CreateCollectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation() // Prevent form submission from bubbling up
    setIsLoading(true)

    try {
      const result = await createCollection(name, description)
      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Collection created successfully!")
      setName("")
      setDescription("")
      setOpen(false)
      onOpenChange?.(false)
      // Pass the created collection ID to the callback
      onCollectionCreated(result.collection?.id)
    } catch (error) {
      toast.error("Failed to create collection")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          type="button" // Explicitly set button type to prevent form submission
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(true)
            onOpenChange?.(true)
          }}
        >
          Create New Collection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
          <DialogDescription>
            Add a new collection to organize your books.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter collection name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter collection description"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 