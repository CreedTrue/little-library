"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { addBook, lookupBookByIsbn } from "@/app/actions/books"
import { getCollections } from "@/app/actions/collections"
import { CollectionSelector } from "./collection-selector"
import Image from "next/image"

interface Collection {
  id: string
  name: string
}

export function AddBookForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isbnData, setIsbnData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("manual")
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    async function fetchCollections() {
      const result = await getCollections()
      if (result.collections) {
        setCollections(result.collections)
      }
    }
    fetchCollections()
  }, [])

  async function handleIsbnLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const isbn = formData.get("isbn") as string

    try {
      const result = await lookupBookByIsbn(isbn)
      if (result.error) {
        setError(result.error)
        return
      }

      setIsbnData(result.book)
      setActiveTab("manual") // Switch to manual tab to show the found book data
    } catch (err) {
      setError("Failed to lookup book")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const bookData = {
      title: formData.get("title") as string,
      author: formData.get("author") as string,
      isbn: formData.get("isbn") as string,
      description: formData.get("description") as string,
      coverImage: formData.get("coverImage") as string,
      collectionIds: selectedCollectionIds,
    }

    try {
      const result = await addBook(bookData)
      if (result.error) {
        setError(result.error)
        return
      }
      router.push("/dashboard")
    } catch (err) {
      setError("Failed to add book")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        <TabsTrigger value="isbn">ISBN Lookup</TabsTrigger>
      </TabsList>
      
      <TabsContent value="manual">
        <Card>
          <CardHeader>
            <CardTitle>Add Book Manually</CardTitle>
            <CardDescription>
              Enter the book details manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit}>
              <div className="flex flex-col gap-6">
                {isbnData?.coverImage && (
                  <div className="flex justify-center">
                    <div className="relative h-48 w-32">
                      <Image
                        src={isbnData.coverImage}
                        alt={`Cover of ${isbnData.title}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  </div>
                )}
                <div className="grid gap-3">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    defaultValue={isbnData?.title}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    name="author"
                    required
                    defaultValue={isbnData?.author}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    name="isbn"
                    defaultValue={isbnData?.isbn}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={isbnData?.description}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    name="coverImage"
                    type="url"
                    defaultValue={isbnData?.coverImage}
                  />
                </div>
                <div className="grid gap-3">
                  <Label>Collections</Label>
                  <CollectionSelector
                    collections={collections}
                    selectedCollectionIds={selectedCollectionIds}
                    onSelectionChange={setSelectedCollectionIds}
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-500">
                    {error}
                  </div>
                )}
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Book"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="isbn">
        <Card>
          <CardHeader>
            <CardTitle>Lookup by ISBN</CardTitle>
            <CardDescription>
              Enter the ISBN number to automatically fetch book details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIsbnLookup}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    name="isbn"
                    required
                    placeholder="Enter ISBN number"
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-500">
                    {error}
                  </div>
                )}
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Looking up..." : "Lookup Book"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
} 