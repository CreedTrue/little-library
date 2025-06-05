import { Suspense } from "react"
import { AddBookForm } from "@/components/add-book-form"

export default function AddBookPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">Add New Book</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <AddBookForm />
        </Suspense>
      </div>
    </div>
  )
} 