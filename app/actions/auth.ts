"use server"

import { hash, compare } from "bcrypt"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { signIn } from "next-auth/react"

export async function setupAdminAccount(email: string, password: string) {
  try {
    // Check if any users exist
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      return { error: "Admin account already exists" }
    }

    // Validate email and password
    if (!email || !password) {
      return { error: "Email and password are required" }
    }

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "Invalid email format" }
    }

    // Check if password is strong enough
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters long" }
    }

    // Hash the password
    const hashedPassword = await hash(password, 12)

    // Create the admin user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "Admin",
      },
    })

    revalidatePath("/login")
    return { success: true }
  } catch (error) {
    console.error("[SETUP_ADMIN]", error)
    return { error: "Failed to create admin account" }
  }
}

export async function login(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email
      }
    })

    if (!user) {
      return { error: "Invalid email or password" }
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      return { error: "Invalid email or password" }
    }

    return { success: true }
  } catch (error) {
    console.error("[LOGIN]", error)
    return { error: "Failed to login" }
  }
} 