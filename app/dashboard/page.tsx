import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "../api/auth/[...nextauth]/route"
import Link from "next/link"

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
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Recently Added</h2>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Top Rated</h2>
            <p className="mt-2 text-3xl font-bold">0</p>
          </div>
        </div>
        <QuickActions />
      </div>
    </div>
  )
} 