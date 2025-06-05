"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { revalidatePath } from "next/cache"
import type { Book, Rating } from "@prisma/client"

export async function addBook(bookData: {
  title: string
  author: string
  isbn?: string
  description?: string
  coverImage?: string
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const book = await prisma.book.create({
      data: {
        ...bookData,
        userId: session.user.id,
      },
    })

    revalidatePath("/dashboard")
    return { success: true, book }
  } catch (error) {
    console.error("[ADD_BOOK]", error)
    return { error: "Failed to add book" }
  }
}

export async function lookupBookByIsbn(isbn: string) {
  try {
    // First, get the book details from the ISBN endpoint
    const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`)
    if (!response.ok) {
      return { error: "Book not found" }
    }
    const data = await response.json()

    // Get the work ID from the book data
    const workId = data.works?.[0]?.key
    let description = ""

    // If we have a work ID, fetch the description
    if (workId) {
      const workResponse = await fetch(`https://openlibrary.org${workId}.json`)
      if (workResponse.ok) {
        const workData = await workResponse.json()
        // Get the description from the work data
        description = workData.description?.value || workData.description || ""
      }
    }

    // Get author details
    let author = "Unknown"
    if (data.authors?.[0]?.key) {
      const authorResponse = await fetch(`https://openlibrary.org${data.authors[0].key}.json`)
      if (authorResponse.ok) {
        const authorData = await authorResponse.json()
        author = authorData.name
      }
    }

    // Get cover image
    const coverId = data.covers?.[0]
    const coverImage = coverId 
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : null

    return {
      book: {
        title: data.title,
        author,
        isbn,
        description,
        coverImage,
      }
    }
  } catch (error) {
    console.error("Error looking up book:", error)
    return { error: "Failed to lookup book" }
  }
}

export async function getBooks({
  search = "",
  sortBy = "title",
  sortOrder = "asc",
  page = 1,
  limit = 12,
}: {
  search?: string;
  sortBy?: "title" | "author" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}) {
  try {
    const skip = (page - 1) * limit;
    
    const where = search
      ? {
          OR: [
            { title: { contains: search.toLowerCase() } },
            { author: { contains: search.toLowerCase() } },
            { isbn: { contains: search } },
          ],
        }
      : {};

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          ratings: true,
        },
      }),
      prisma.book.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      books: books.map(book => ({
        ...book,
        averageRating: book.ratings.length > 0
          ? book.ratings.reduce((acc, rating) => acc + rating.value, 0) / book.ratings.length
          : null,
      })),
      totalPages,
      currentPage: page,
      total,
    };
  } catch (error) {
    console.error("Error fetching books:", error);
    return { error: "Failed to fetch books" };
  }
}

export async function submitRating(bookId: string, rating: number) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: "You must be logged in to rate books" }
    }

    // Check if user has already rated this book
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
    })

    if (existingRating) {
      // Update existing rating
      await prisma.rating.update({
        where: {
          id: existingRating.id,
        },
        data: {
          value: rating,
        },
      })
    } else {
      // Create new rating
      await prisma.rating.create({
        data: {
          value: rating,
          userId: session.user.id,
          bookId,
        },
      })
    }

    revalidatePath("/library")
    return { success: true }
  } catch (error) {
    console.error("Error submitting rating:", error)
    return { error: "Failed to submit rating" }
  }
} 