import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")
  if (!query) {
    return NextResponse.json({ error: "Query parameter required" }, { status: 400 })
  }

  const apiKey = process.env.BRAVE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Brave API key not configured" }, { status: 500 })
  }

  try {
    const url = new URL("https://api.search.brave.com/res/v1/images/search")
    url.searchParams.set("q", query)
    url.searchParams.set("count", "20")
    url.searchParams.set("safe", "strict")

    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "x-Subscription-Token": apiKey,
      },
    })

    if (!response.ok) {
      console.error("Brave API error:", response.status, await response.text())
      return NextResponse.json({ error: "Image search failed" }, { status: response.status })
    }

    const data = await response.json()

    const results = (data.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      thumbnail: result.thumbnail?.src || result.url,
      pageUrl: result.page_url,
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error searching images:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
