import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import AddBookPageContent from "@/app/books/add/add-book-content"

export default async function AddBookPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddBookPageContent />
    </Suspense>
  )
} 