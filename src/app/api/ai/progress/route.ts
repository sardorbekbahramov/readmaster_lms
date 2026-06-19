import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { generateWeeklyInsight } from "@/lib/ai/modules/progress-coach"
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!session.user.enrollmentId) return NextResponse.json({ error: "No enrollment" }, { status: 400 })
    await generateWeeklyInsight({ userId: session.user.id, enrollmentId: session.user.enrollmentId })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }) }
}
