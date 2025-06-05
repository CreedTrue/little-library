import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "../api/auth/[...nextauth]/route"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

async function getStats() {
  const totalBooks = await prisma.book.count()
  const fourDaysAgo = new Date()
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)
  const recentlyAdded = await prisma.book.count({
    where: {
      createdAt: {
        gte: fourDaysAgo,
      },
    },
  })
  const topRated = await prisma.book.findMany({
    include: {
      ratings: true,
    },
    take: 5,
  })

  // Sort the books by average rating in memory
  const sortedTopRated = topRated.sort((a: { ratings: { value: number }[] }, b: { ratings: { value: number }[] }) => {
    const avgRatingA = a.ratings.reduce((acc: number, curr: { value: number }) => acc + curr.value, 0) / a.ratings.length;
    const avgRatingB = b.ratings.reduce((acc: number, curr: { value: number }) => acc + curr.value, 0) / b.ratings.length;
    return avgRatingB - avgRatingA;
  });

  return { totalBooks, recentlyAdded, topRated: sortedTopRated }
}

function QuickActions() {
  return (
    <div className="mt-6">
      <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/books/add">
          <button className="rounded-lg border bg-card p-4 text-left hover:bg-accent w-full">
            <h3 className="font-semibold">Add New Book</h3>
            <p className="text-sm text-gray-500">Manually add a book to your library</p>
          </button>
        </Link>
        <button className="rounded-lg border bg-card p-4 text-left hover:bg-accent w-full" disabled>
          <h3 className="font-semibold">Search by ISBN</h3>
          <p className="text-sm text-gray-500">Add a book using its ISBN number</p>
        </button>
        <Link href="/library">
          <button className="rounded-lg border bg-card p-4 text-left hover:bg-accent w-full">
            <h3 className="font-semibold">Browse Library</h3>
            <p className="text-sm text-gray-500">View and manage your book collection</p>
          </button>
        </Link>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const { totalBooks, recentlyAdded, topRated } = await getStats()

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Library Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Welcome, {session.user?.name || session.user?.email}
            </span>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Stats */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Total Books</h2>
            <p className="mt-2 text-3xl font-bold">{totalBooks}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Recently Added</h2>
            <p className="mt-2 text-3xl font-bold">{recentlyAdded}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Top Rated</h2>
            <p className="mt-2 text-3xl font-bold">{topRated.length}</p>
          </div>
        </div>
        <QuickActions />
      </div>
    </div>
  )
} 