import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { awardXP, type XpReason } from "@/lib/gamification/xp.service"
import { updateStreak } from "@/lib/gamification/streak.service"
import { evaluateAchievements } from "@/lib/gamification/achievement.service"
import { z } from "zod"
const schema = z.object({ reason: z.string(), enrollmentId: z.string().cuid().optional(), sourceId: z.string().optional(), overrideAmount: z.number().int().positive().optional() })
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const data = schema.parse(await req.json())
    const result = await awardXP({ userId: session.user.id, enrollmentId: data.enrollmentId, reason: data.reason as XpReason, sourceId: data.sourceId, overrideAmount: data.overrideAmount })
    await updateStreak(session.user.id)
    await evaluateAchievements(session.user.id)
    return NextResponse.json(result)
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }) }
}
