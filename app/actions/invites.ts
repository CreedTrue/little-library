"use server"

import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"
import crypto from "crypto"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"

async function isAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return false
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })
  return user?.role === "ADMIN"
}

export async function createInvite(email: string) {
  if (!(await isAdmin())) {
    return { error: "Unauthorized" }
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return { error: "User with this email already exists." }
    }

    const inviteToken = crypto.randomBytes(32).toString("hex")
    const hashedInviteToken = crypto
      .createHash("sha256")
      .update(inviteToken)
      .digest("hex")

    const inviteTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.user.create({
      data: {
        email,
        inviteToken: hashedInviteToken,
        inviteTokenExpires,
      },
    })

    return { inviteToken }
  } catch (error) {
    console.error("Error creating invite:", error)
    return { error: "Failed to create invite." }
  }
}

export async function verifyInviteToken(token: string) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

  const user = await prisma.user.findUnique({
    where: { inviteToken: hashedToken },
  })

  if (!user || !user.inviteTokenExpires) {
    return { error: "Invalid token." }
  }

  if (new Date() > user.inviteTokenExpires) {
    return { error: "Token has expired." }
  }

  return { success: true, email: user.email }
}

export async function acceptInvite(
  token: string,
  name: string,
  password: string
) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

  const user = await prisma.user.findUnique({
    where: { inviteToken: hashedToken },
  })

  if (!user || !user.inviteTokenExpires) {
    return { error: "Invalid token." }
  }

  if (new Date() > user.inviteTokenExpires) {
    return { error: "Token has expired." }
  }

  const hashedPassword = await hash(password, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      password: hashedPassword,
      inviteToken: null,
      inviteTokenExpires: null,
    },
  })

  return { success: true }
}
