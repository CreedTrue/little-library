"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { unlink, writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

async function removeLocalCover(coverImage: string | null) {
  if (!coverImage || !coverImage.startsWith("/covers/")) return
  try {
    const coversDir = process.env.COVERS_DIR || "public/covers"
    const filePath = path.join(process.cwd(), coversDir, path.basename(coverImage))
    await unlink(filePath)
  } catch (error) {
    console.error(`Error removing local cover ${coverImage}:`, error)
  }
}

async function downloadAndSaveImage(imageUrl: string): Promise<string | null> {
  if (!imageUrl.startsWith("http")) return imageUrl

  try {
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) })
    if (!response.ok) return null

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.startsWith("image/")) return null

    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/avif": "avif",
    }
    const ext = extMap[contentType] || "webp"

    const buffer = Buffer.from(await response.arrayBuffer())
    const filename = `${crypto.randomUUID()}.${ext}`
    const coversDir = path.join(process.cwd(), process.env.COVERS_DIR || "public/covers")

    await mkdir(coversDir, { recursive: true })
    await writeFile(path.join(coversDir, filename), buffer)

    return `/covers/${filename}`
  } catch (error) {
    console.error(`Error downloading image from ${imageUrl}:`, error)
    return null
  }
}

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
  incrementQuantityOf?: string
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    const { collectionIds, incrementQuantityOf, ...bookData } = data

    if (bookData.coverImage) {
      bookData.coverImage = (await downloadAndSaveImage(bookData.coverImage)) ?? undefined
    }

    if (incrementQuantityOf) {
      const existingBook = await prisma.book.findFirst({
        where: { id: incrementQuantityOf, userId: session.user.id },
        include: {
          collections: { select: { id: true } },
        },
      })

      if (!existingBook) {
        return { error: "Book not found" }
      }

      const existingCollectionIds = existingBook.collections.map((c) => c.id)
      const mergedCollectionIds = [
        ...new Set([...existingCollectionIds, ...(collectionIds || [])]),
      ]

      const book = await prisma.book.update({
        where: { id: incrementQuantityOf },
        data: {
          quantity: { increment: 1 },
          collections: {
            set: mergedCollectionIds.map((id) => ({ id })),
          },
        },
        include: {
          collections: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return { book }
    }

    const book = await prisma.book.create({
      data: {
        ...bookData,
        userId: session.user.id,
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

export async function checkDuplicateBook(data: {
  title: string
  author: string
  isbn: string
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    const { title, author, isbn } = data
    const userId = session.user.id

    const allUserBooks = await prisma.book.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        coverImage: true,
        quantity: true,
      },
    })

    const normalizedIsbn = isbn.trim().toLowerCase()
    const exactMatch = allUserBooks.find(
      (b) => b.isbn.trim().toLowerCase() === normalizedIsbn && normalizedIsbn.length > 0
    )

    if (exactMatch) {
      return {
        type: "exact" as const,
        existingBook: exactMatch,
      }
    }

    const normalizedTitle = title.trim().toLowerCase()
    const normalizedAuthor = author.trim().toLowerCase()
    const editionMatch = allUserBooks.find(
      (b) =>
        b.title.trim().toLowerCase() === normalizedTitle &&
        b.author.trim().toLowerCase() === normalizedAuthor &&
        b.isbn.trim().toLowerCase() !== normalizedIsbn
    )

    if (editionMatch) {
      return {
        type: "edition" as const,
        existingBook: editionMatch,
      }
    }

    return { type: "none" as const }
  } catch (error) {
    console.error("Error checking duplicate book:", error)
    return { error: "Failed to check for duplicates" }
  }
}

export async function getBooks({
  search = "",
  sortBy = "title",
  sortOrder = "asc",
  page = 1,
  limit = 12,
  readStatus = "all",
  collection = "",
}: {
  search?: string;
  sortBy?: "title" | "author" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  readStatus?: "all" | "read" | "unread";
  collection?: string;
}) {
  try {
    const skip = (page - 1) * limit;
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }
    const userId = session.user.id

    const conditions: any[] = []

    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search } },
          { author: { contains: search } },
          { isbn: { contains: search } },
        ],
      })
    }

    if (readStatus === "read") {
      conditions.push({
        readStatuses: { some: { userId, read: true } },
      })
    } else if (readStatus === "unread") {
      conditions.push({
        OR: [
          { readStatuses: { none: { userId } } },
          { readStatuses: { some: { userId, read: false } } },
        ],
      })
    }

    if (collection && collection !== "all") {
      conditions.push({
        collections: { some: { id: collection } },
      })
    }

    const where = conditions.length > 0 ? { AND: conditions } : {}

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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    // Verify the book belongs to the user
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { userId: true, coverImage: true },
    })

    if (!book) {
      return { error: "Book not found" }
    }

    if (book.userId !== session.user.id) {
      return { error: "Not authorized to remove this book" }
    }

    await removeLocalCover(book.coverImage)

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
    quantity?: number
    collectionIds?: string[]
  }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { error: "Not authenticated" }
    }

    const existingBook = await prisma.book.findUnique({
      where: { id: bookId },
      select: { userId: true, coverImage: true },
    })

    if (!existingBook) {
      return { error: "Book not found" }
    }

    if (existingBook.userId !== session.user.id) {
      return { error: "Not authorized to update this book" }
    }

    const { collectionIds, ...bookData } = data

    if (bookData.coverImage !== undefined && bookData.coverImage !== existingBook.coverImage) {
      await removeLocalCover(existingBook.coverImage)
      bookData.coverImage = (await downloadAndSaveImage(bookData.coverImage)) ?? undefined
    }

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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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