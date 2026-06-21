import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { paragraphAttemptSchema } from "@/lib/validations/progress.schema"
import { awardXP } from "@/lib/gamification/xp.service"
import { updateStreak } from "@/lib/gamification/streak.service"
import { evaluateAchievements } from "@/lib/gamification/achievement.service"
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const data = paragraphAttemptSchema.parse(await req.json())
    const paragraph = await prisma.paragraph.findUnique({ where: { id: data.paragraphId }, include: { unit: { include: { lessons: { take: 1, include: { questions: { where: { stepTypeId: 3 }, orderBy: { sortOrder: "asc" } } } } } } } })
    if (!paragraph) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const question = paragraph.unit.lessons[0]?.questions[data.paragraphIndex]
    const isCorrect = question?.correctAnswer === data.answer
    let completionStatus = "in_progress", xpReason: string | null = null
    if (isCorrect && data.attemptNumber === 1) { completionStatus = "strong"; xpReason = "para_correct_first" }
    else if (isCorrect && data.attemptNumber === 2) { completionStatus = "reviewed"; xpReason = "para_correct_second" }
    else if (!isCorrect && data.attemptNumber >= 2) { completionStatus = "ai_assisted"; xpReason = "para_ai_assist" }
    const isCompleted = completionStatus !== "in_progress"
    await prisma.paragraphAttempt.upsert({
      where: { enrollmentId_paragraphId: { enrollmentId: data.enrollmentId, paragraphId: data.paragraphId } },
      update: { answerSubmitted: data.answer, isCorrect, attemptNumber: data.attemptNumber, readingDurationSec: data.readingDurationSec, audioPlayed: data.audioPlayed, confidenceRating: data.confidenceRating, completionStatus, completedAt: isCompleted ? new Date() : null, xpAwarded: xpReason ? (data.attemptNumber === 1 ? 15 : data.attemptNumber === 2 ? 8 : 3) : 0 },
      create: { enrollmentId: data.enrollmentId, paragraphId: data.paragraphId, unitId: data.unitId, readingStartedAt: new Date(data.readingStartedAt), answerSubmitted: data.answer, isCorrect, attemptNumber: data.attemptNumber, readingDurationSec: data.readingDurationSec, audioPlayed: data.audioPlayed ?? false, confidenceRating: data.confidenceRating, completionStatus, completedAt: isCompleted ? new Date() : null, xpAwarded: xpReason ? (data.attemptNumber === 1 ? 15 : data.attemptNumber === 2 ? 8 : 3) : 0 },
    })
    let xpResult = null
    if (xpReason && isCompleted) {
      xpResult = await awardXP({ userId: session.user.id, enrollmentId: data.enrollmentId, reason: xpReason as any, sourceId: data.paragraphId })
      await updateStreak(session.user.id)
      await evaluateAchievements(session.user.id)
    }
    const [total, completed] = await Promise.all([
      prisma.paragraph.count({ where: { unitId: data.unitId } }),
      prisma.paragraphAttempt.count({ where: { enrollmentId: data.enrollmentId, unitId: data.unitId, completionStatus: { in: ["strong", "reviewed", "ai_assisted"] } } }),
    ])
    let readingStepComplete = false
    if (completed >= total) {
      readingStepComplete = true
      xpResult = await awardXP({ userId: session.user.id, enrollmentId: data.enrollmentId, reason: "reading_step_complete", sourceId: data.unitId })
    }
    return NextResponse.json({ isCorrect, completionStatus, xpResult, readingStepComplete, paragraphsCompleted: completed, totalParagraphs: total })
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    console.error("[progress/paragraph]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
