import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { generateWeeklyInsight } from "@/lib/ai/modules/progress-coach"
import { checkAndBreakStreak } from "@/lib/gamification/streak.service"
import { getWeekStart } from "@/lib/utils"
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const job = req.nextUrl.searchParams.get("job")
  if (job === "weekly-insights") {
    const enrollments = await prisma.enrollment.findMany({ where: { status: "active" }, select: { id: true, studentId: true } })
    for (const e of enrollments) await generateWeeklyInsight({ userId: e.studentId, enrollmentId: e.id }).catch(console.error)
    return NextResponse.json({ ok: true, processed: enrollments.length })
  }
  if (job === "streak-check") {
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } })
    for (const u of users) await checkAndBreakStreak(u.id).catch(console.error)
    return NextResponse.json({ ok: true, processed: users.length })
  }
  if (job === "leaderboard-snapshot") {
    const ws = getWeekStart(), pws = new Date(ws); pws.setDate(pws.getDate() - 7)
    const classes = await prisma.class.findMany({ where: { isActive: true }, include: { enrollments: { where: { status: "active" }, include: { student: { select: { displayName: true, fullName: true, hideFromLeaderboard: true } }, xpEvents: { where: { occurredAt: { gte: pws, lt: ws } }, select: { xpAmount: true } } } } } })
    for (const cls of classes) {
      const rankings = cls.enrollments.map((e) => ({ userId: e.studentId, displayName: e.student.hideFromLeaderboard ? "Hidden" : (e.student.displayName ?? e.student.fullName), weeklyXp: e.xpEvents.reduce((s, ev) => s + ev.xpAmount, 0) })).sort((a, b) => b.weeklyXp - a.weeklyXp).map((s, i) => ({ ...s, rank: i + 1 }))
      await prisma.leaderboardSnapshot.upsert({ where: { classId_weekStart: { classId: cls.id, weekStart: pws } }, update: { rankings }, create: { classId: cls.id, weekStart: pws, rankings } })
    }
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: "Unknown job" }, { status: 400 })
}
