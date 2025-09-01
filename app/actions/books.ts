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
  collectionIds?: string[]
}

export async function addBook(data: {
  title: string
  author: string
  isbn: string
  description?: string
  coverImage?: string
  collectionIds?: string[]
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

    const { collectionIds, ...bookData } = data

    const book = await prisma.book.create({
      data: {
        ...bookData,
        userId: user.id,
        collections: {
          connect: collectionIds?.map((id) => ({ id })),
        },
      },
      include: {
        collections: {
          select: {
            id: true,
            name: true,
          },
        },
      },
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
  readStatus = "all",
}: {
  search?: string;
  sortBy?: "title" | "author" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  readStatus?: "all" | "read" | "unread";
}) {
  try {
    const skip = (page - 1) * limit;
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }
    const userId = session.user.id

    let where: any = {}

    // Handle search filtering
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search } },
      ]
    }

    // Handle read status filtering
    if (readStatus !== "all") {
      if (readStatus === "read") {
        // For "read" status: books that have a readStatus record with read: true
        where.readStatuses = {
          some: {
            userId,
            read: true,
          },
        }
      } else if (readStatus === "unread") {
        // For "unread" status: books that either have no readStatus record OR have readStatus with read: false
        where.OR = [
          {
            readStatuses: {
              none: {
                userId,
              },
            },
          },
          {
            readStatuses: {
              some: {
                userId,
                read: false,
              },
            },
          },
        ]
      }
    }

    // If both search and readStatus filters are active, combine them with AND
    if (search && readStatus !== "all") {
      const searchCondition = {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { author: { contains: search, mode: "insensitive" } },
          { isbn: { contains: search } },
        ],
      }

      const readStatusCondition = readStatus === "read" 
        ? {
            readStatuses: {
              some: {
                userId,
                read: true,
              },
            },
          }
        : {
            OR: [
              {
                readStatuses: {
                  none: {
                    userId,
                  },
                },
              },
              {
                readStatuses: {
                  some: {
                    userId,
                    read: false,
                  },
                },
              },
            ],
          }

      where = {
        AND: [searchCondition, readStatusCondition],
      }
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          ratings: true,
          readStatuses: {
            where: { userId },
          },
          collections: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.book.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      books: books.map((book) => ({
        ...book,
        averageRating:
          book.ratings.length > 0
            ? book.ratings.reduce((acc, rating) => acc + rating.value, 0) /
              book.ratings.length
            : null,
        read: book.readStatuses[0]?.read || false,
      })),
      totalPages,
      currentPage: page,
      total,
    }
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

export async function setReadStatus(bookId: string, read: boolean) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: "You must be logged in to update read status" }
    }

    const existingStatus = await prisma.bookReadStatus.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId,
        },
      },
    })

    if (existingStatus) {
      await prisma.bookReadStatus.update({
        where: {
          id: existingStatus.id,
        },
        data: {
          read,
        },
      })
    } else {
      await prisma.bookReadStatus.create({
        data: {
          read,
          userId: session.user.id,
          bookId,
        },
      })
    }

    revalidatePath("/library")
    revalidatePath(`/books/${bookId}`) // Revalidate book details page if it exists
    return { success: true }
  } catch (error) {
    console.error("Error setting read status:", error)
    return { error: "Failed to set read status" }
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

export async function updateBook(
  bookId: string,
  data: {
    title?: string
    author?: string
    isbn?: string
    description?: string
    coverImage?: string
    collectionIds?: string[]
  }
) {
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

    const { collectionIds, ...bookData } = data

    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: {
        ...bookData,
        collections: {
          set: collectionIds?.map((id) => ({ id })),
        },
        updatedAt: new Date(),
      },
      include: {
        collections: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    revalidatePath("/library")
    return { book: updatedBook }
  } catch (error) {
    console.error("Error updating book:", error)
    return { error: "Failed to update book" }
  }
} 