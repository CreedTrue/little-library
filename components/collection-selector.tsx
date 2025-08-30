"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
interface Collection {
  id: string
  name: string
}

interface CollectionSelectorProps {
  collections: Collection[]
  selectedCollectionIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
}

export function CollectionSelector({
  collections,
  selectedCollectionIds,
  onSelectionChange,
}: CollectionSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedCollectionIds)

  useEffect(() => {
    setSelectedIds(selectedCollectionIds)
  }, [selectedCollectionIds])

  const handleToggle = (collectionId: string) => {
    const newSelectedIds = selectedIds.includes(collectionId)
      ? selectedIds.filter((id) => id !== collectionId)
      : [...selectedIds, collectionId]

    setSelectedIds(newSelectedIds)
    onSelectionChange(newSelectedIds)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {collections.map((collection) => (
        <Badge
          key={collection.id}
          onClick={() => handleToggle(collection.id)}
          variant={selectedIds.includes(collection.id) ? "default" : "outline"}
          className="cursor-pointer"
        >
          {collection.name}
        </Badge>
      ))}
    </div>
  )
}
