import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    // Check if any users exist
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      return new NextResponse(
        JSON.stringify({ message: "Admin account already exists" }),
        { status: 400 }
      )
    }

    // Validate email and password
    if (!email || !password) {
      return new NextResponse(
        JSON.stringify({ message: "Email and password are required" }),
        { status: 400 }
      )
    }

    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new NextResponse(
        JSON.stringify({ message: "Invalid email format" }),
        { status: 400 }
      )
    }

    // Check if password is strong enough
    if (password.length < 8) {
      return new NextResponse(
        JSON.stringify({ message: "Password must be at least 8 characters long" }),
        { status: 400 }
      )
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

    return NextResponse.json({
      message: "Admin account created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("[SETUP_POST]", error)
    return new NextResponse(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500 }
    )
  }
} 