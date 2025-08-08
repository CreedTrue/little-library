import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("Checking user count...")
    const userCount = await prisma.user.count()
    console.log("User count:", userCount)
    
    return NextResponse.json({ count: userCount })
  } catch (error) {
    console.error("Error checking user count:", error)
    return NextResponse.json(
      { error: "Failed to check user count", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
