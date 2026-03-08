import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { scrapeListing } from "@/lib/scraper";

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const data = await scrapeListing(url);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to scrape URL";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
