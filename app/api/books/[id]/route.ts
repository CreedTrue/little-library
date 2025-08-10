import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const book = await prisma.book.findUnique({
      where: { id: params.id },
      include: {
        ratings: true,
        collections: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!book) {
      return new NextResponse("Book not found", { status: 404 })
    }

    // Verify the book belongs to the user
    if (book.userId !== user.id) {
      return new NextResponse("Not authorized", { status: 403 })
    }

    // Calculate average rating
    const averageRating = book.ratings.length > 0
      ? book.ratings.reduce((acc, rating) => acc + rating.value, 0) / book.ratings.length
      : null

    return NextResponse.json({
      ...book,
      averageRating
    })
  } catch (error) {
    console.error('[BOOK_GET]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
