"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function getCollections() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return { error: "Not authenticated" }
  }

  try {
    const collections = await prisma.collection.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      include: {
        books: true,
      },
    })
    return { collections }
  } catch (error) {
    console.error("Error fetching collections:", error)
    return { error: "Failed to fetch collections" }
  }
}

export async function createCollection(name: string, description?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return { error: "Not authenticated" }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return { error: "User not found" }
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        userId: user.id,
      },
    })

    return { collection }
  } catch (error) {
    console.error("Error creating collection:", error)
    return { error: "Failed to create collection" }
  }
} 