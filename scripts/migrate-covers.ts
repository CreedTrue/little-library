import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

async function migrateExistingCovers() {
  console.log("Fetching books with external cover images...")

  const books = await prisma.book.findMany({
    where: {
      coverImage: {
        startsWith: "http",
      },
    },
    select: {
      id: true,
      title: true,
      coverImage: true,
    },
  })

  console.log(`Found ${books.length} books with external cover URLs`)
  let migrated = 0
  let failed = 0

  for (const book of books) {
    if (!book.coverImage) continue

    try {
      const url = book.coverImage
      console.log(`  [${migrated + 1}/${books.length}] ${book.title}: ${url}`)

      const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (!response.ok) {
        console.log(`    -> Fetch failed (${response.status}), clearing cover`)
        await prisma.book.update({
          where: { id: book.id },
          data: { coverImage: null },
        })
        failed++
        continue
      }

      const contentType = response.headers.get("content-type") || ""
      if (!contentType.startsWith("image/")) {
        console.log(`    -> Not an image (${contentType}), clearing cover`)
        await prisma.book.update({
          where: { id: book.id },
          data: { coverImage: null },
        })
        failed++
        continue
      }

      const extMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/avif": "avif",
      }
      const ext = extMap[contentType] || "webp"
      const buffer = Buffer.from(await response.arrayBuffer())
      const filename = `${crypto.randomUUID()}.${ext}`
      const coversDir = path.join(process.cwd(), process.env.COVERS_DIR || "public/covers")

      await mkdir(coversDir, { recursive: true })
      await writeFile(path.join(coversDir, filename), buffer)

      await prisma.book.update({
        where: { id: book.id },
        data: { coverImage: `/covers/${filename}` },
      })

      console.log(`    -> Saved as /covers/${filename}`)
      migrated++
    } catch (error) {
      console.log(`    -> Error: ${error}, clearing cover`)
      await prisma.book.update({
        where: { id: book.id },
        data: { coverImage: null },
      })
      failed++
    }
  }

  console.log(`\nDone! ${migrated} migrated, ${failed} failed, ${books.length - migrated - failed} skipped`)
}

migrateExistingCovers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
