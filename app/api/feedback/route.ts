import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { sendFeedbackEmail } from "@/lib/email";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!rateLimit(`feedback:${user.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { message } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.trim().length > 2000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  await sendFeedbackEmail({
    fromName: user.name || user.email,
    fromEmail: user.email,
    message: message.trim(),
  });

  return NextResponse.json({ success: true });
}
