import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { title, author, isbn, description, coverImage } = body

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        description,
        coverImage,
        userId: session.user.id
      }
    })

    return NextResponse.json(book)
  } catch (error) {
    console.error('[BOOKS_POST]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const books = await prisma.book.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        ratings: true
      }
    })

    return NextResponse.json(books)
  } catch (error) {
    console.error('[BOOKS_GET]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}