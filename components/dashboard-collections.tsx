import { getCollections } from "@/app/actions/collections"
import { CollectionScroll } from "./collection-scroll"

// Helper function to calculate average rating
const calculateAverageRating = (ratings: { value: number }[]) => {
  if (!ratings || ratings.length === 0) {
    return 0
  }
  const sum = ratings.reduce((acc, rating) => acc + rating.value, 0)
  return sum / ratings.length
}

export async function DashboardCollections() {
  const { collections, error } = await getCollections()

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (!collections || collections.length === 0) {
    return (
      <div className="mt-6 text-center text-gray-500">
        <p>You haven&apos;t created any collections yet.</p>
      </div>
    )
  }

  // Manually calculate averageRating for each book
  const collectionsWithAvgRating = collections.map(collection => ({
    ...collection,
    books: collection.books.map((book: any) => ({
      ...book,
      averageRating: calculateAverageRating(book.ratings),
    })),
  }))

  return (
    <div className="mt-8 space-y-8">
      {collectionsWithAvgRating.map((collection) => (
        <CollectionScroll key={collection.id} collection={collection} />
      ))}
    </div>
  )
}
