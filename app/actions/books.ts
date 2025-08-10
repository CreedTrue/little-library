"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

interface AddBookData {
  title: string
  author: string
  isbn?: string
  description?: string
  coverImage?: string
  collectionId?: string
}

export async function addBook(data: {
  title: string
  author: string
  isbn: string
  description?: string
  coverImage?: string
  collectionId?: string
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return { error: "Not authenticated" }
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return { error: "User not found" }
    }

    const { collectionId, ...bookData } = data

    const book = await prisma.book.create({
      data: {
        ...bookData,
        userId: user.id,
        collections: collectionId ? {
          connect: { id: collectionId }
        } : undefined
      },
      include: {
        collections: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return { book }
  } catch (error) {
    console.error("Error adding book:", error)
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
          collections: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.book.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      books: books.map((book) => ({
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

export async function removeBook(bookId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return { error: "Not authenticated" }
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return { error: "User not found" }
    }

    // Verify the book belongs to the user
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { userId: true },
    })

    if (!book) {
      return { error: "Book not found" }
    }

    if (book.userId !== user.id) {
      return { error: "Not authorized to remove this book" }
    }

    // Delete the book
    await prisma.book.delete({
      where: { id: bookId },
    })

    return { success: true }
  } catch (error) {
    console.error("Error removing book:", error)
    return { error: "Failed to remove book" }
  }
}

export async function updateBook(bookId: string, data: {
  title?: string
  author?: string
  isbn?: string
  description?: string
  coverImage?: string
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return { error: "Not authenticated" }
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return { error: "User not found" }
    }

    // Verify the book belongs to the user
    const existingBook = await prisma.book.findUnique({
      where: { id: bookId },
      select: { userId: true },
    })

    if (!existingBook) {
      return { error: "Book not found" }
    }

    if (existingBook.userId !== user.id) {
      return { error: "Not authorized to update this book" }
    }

    // Update the book
    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        collections: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    revalidatePath("/library")
    return { book: updatedBook }
  } catch (error) {
    console.error("Error updating book:", error)
    return { error: "Failed to update book" }
  }
} 