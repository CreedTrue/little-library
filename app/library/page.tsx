import { getBooks } from "@/app/actions/books"
import { BookGrid } from "@/components/book-grid"
import { LibraryFilters } from "@/components/library-filters"

interface LibraryPageProps {
  searchParams: {
    search?: string
    sortBy?: string
    sortOrder?: string
    page?: string
  }
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  // Use default values directly from searchParams
  const result = await getBooks({
    search: searchParams.search || "",
    sortBy: (searchParams.sortBy as "title" | "author" | "createdAt") || "title",
    sortOrder: (searchParams.sortOrder as "asc" | "desc") || "asc",
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  })

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
      <LibraryFilters />
      <BookGrid 
        books={result.books}
        totalPages={result.totalPages || 1}
        currentPage={result.currentPage || 1}
      />
    </div>
  )
} 