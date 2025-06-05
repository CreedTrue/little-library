"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCallback, useEffect, useState } from "react"
import { useDebounce } from "@/lib/hooks/use-debounce"

export function LibraryFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const debouncedSearch = useDebounce(search, 300)

  const createQueryString = useCallback(
    (params: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams.toString())
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value)
        } else {
          newParams.delete(key)
        }
      })
      return newParams.toString()
    },
    [searchParams]
  )

  useEffect(() => {
    const queryString = createQueryString({ search: debouncedSearch })
    router.push(`/library?${queryString}`)
  }, [debouncedSearch, createQueryString, router])

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <Input
        placeholder="Search books..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="sm:max-w-xs"
      />
      <Select
        defaultValue={searchParams.get("sortBy") || "title"}
        onValueChange={(value) => {
          const queryString = createQueryString({ sortBy: value })
          router.push(`/library?${queryString}`)
        }}
      >
        <SelectTrigger className="sm:max-w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="title">Title</SelectItem>
          <SelectItem value="author">Author</SelectItem>
          <SelectItem value="createdAt">Date Added</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get("sortOrder") || "asc"}
        onValueChange={(value) => {
          const queryString = createQueryString({ sortOrder: value })
          router.push(`/library?${queryString}`)
        }}
      >
        <SelectTrigger className="sm:max-w-[180px]">
          <SelectValue placeholder="Sort order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Ascending</SelectItem>
          <SelectItem value="desc">Descending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
} 