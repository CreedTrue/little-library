import { Suspense } from "react"
import { getBooks } from "@/app/actions/books"
import { getCollections } from "@/app/actions/collections"
import { BookGrid } from "@/components/book-grid"
import { LibraryFilters } from "@/components/library-filters"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

type SortBy = "title" | "author" | "createdAt"
type SortOrder = "asc" | "desc"
type ReadStatus = "all" | "read" | "unread"

type Props = {
  params: Promise<{ [key: string]: string | string[] | undefined }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function LibraryPage({ searchParams }: Props) {

  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }
  const resolvedSearchParams = await searchParams
  const search = (resolvedSearchParams.search as string) || ""
  const sortBy = ((resolvedSearchParams.sortBy as string) || "title") as SortBy
  const sortOrder = ((resolvedSearchParams.sortOrder as string) || "asc") as SortOrder
  const page = parseInt((resolvedSearchParams.page as string) || "1")
  const readStatus = ((resolvedSearchParams.readStatus as string) || "all") as ReadStatus
  const collection = (resolvedSearchParams.collection as string) || ""

  const [result, collectionsResult] = await Promise.all([
    getBooks({
      search,
      sortBy,
      sortOrder,
      page,
      readStatus,
      collection,
    }),
    getCollections(),
  ])

  if (result.error) {
    return (
      <div className="container py-8">
        <div className="text-red-500">{result.error}</div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Library</h1>
      <Suspense fallback={<div className="h-10" />}>
        <LibraryFilters collections={collectionsResult.collections || []} />
      </Suspense>
      <Suspense fallback={<div>Loading...</div>}>
        <BookGrid 
          books={result.books || []}
          totalPages={result.totalPages || 1}
          currentPage={result.currentPage || 1}
        />
      </Suspense>
    </div>
  )
} 