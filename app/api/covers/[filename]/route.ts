import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  try {
    const coversDir = process.env.COVERS_DIR || "public/covers"
    const filePath = path.join(process.cwd(), coversDir, filename)
    const buffer = await readFile(filePath)

    const ext = filename.split(".").pop()?.toLowerCase()
    const contentType =
      ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "gif"
            ? "image/gif"
            : ext === "avif"
              ? "image/avif"
              : "image/webp"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error(`Error serving cover image ${filename}:`, error)
    return new NextResponse("Image not found", { status: 404 })
  }
}
