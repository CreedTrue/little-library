"use server"

import { hash, compare } from "bcrypt"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { signIn } from "next-auth/react"

export async function registerUser(email: string, password: string, name?: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { error: "User already exists" }
    }

    const hashedPassword = await hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    return { user }
  } catch (error) {
    console.error("Error registering user:", error)
    return { error: "Failed to register user" }
  }
}

export async function setupAdminAccount(email: string, password: string) {
  try {
    console.log("setupAdminAccount called with email:", email)
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log("User already exists")
      return { error: "Admin account already exists" }
    }

    console.log("Hashing password...")
    const hashedPassword = await hash(password, 12)
    console.log("Password hashed successfully")

    console.log("Creating user in database...")
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "Admin"
      }
    })
    console.log("User created successfully:", user.id)

    console.log("Revalidating path...")
    revalidatePath("/login")
    console.log("Path revalidated")

    console.log("Returning user object:", { id: user.id, email: user.email, name: user.name })
    return { user }
  } catch (error) {
    console.error("Error setting up admin account:", error)
    return { error: "Failed to set up admin account" }
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

    if (!user.password) {
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