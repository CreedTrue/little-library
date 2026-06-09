import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("image") as File | null

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const ext = "webp"
    const filename = `${crypto.randomUUID()}.${ext}`
    const coversDir = path.join(process.cwd(), "public", "covers")

    await mkdir(coversDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(coversDir, filename), buffer)

    const url = `/covers/${filename}`
    return NextResponse.json({ url })
  } catch (error) {
    console.error("Error uploading cover:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
