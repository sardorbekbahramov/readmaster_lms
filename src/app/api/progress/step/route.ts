import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/db/prisma"
import { awardXP } from "@/lib/gamification/xp.service"
import { updateStreak } from "@/lib/gamification/streak.service"
import { evaluateAchievements } from "@/lib/gamification/achievement.service"
import { z } from "zod"
const schema = z.object({ enrollmentId: z.string().cuid(), unitId: z.string().cuid(), stepTypeId: z.number().int().min(1).max(10), score: z.number().min(0).max(100), passed: z.boolean(), answers: z.array(z.object({ questionId: z.string(), answer: z.string(), isCorrect: z.boolean() })).optional(), durationSec: z.number().int().optional() })
const STEP_XP: Record<number, string> = { 1: "step_pass_prereading", 2: "step_pass_vocab", 4: "step_pass_comprehension", 5: "step_pass_idioms", 6: "step_pass_grammar", 7: "step_pass_listening", 8: "discussion_submitted", 10: "step_pass_vocab_review" }
const PERFECT_XP: Record<number, string> = { 2: "perfect_score_vocab", 4: "perfect_score_comprehension", 6: "perfect_score_grammar" }
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const data = schema.parse(await req.json())
    const lesson = await prisma.lesson.findFirst({ where: { unit: { id: data.unitId } } })
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    const last = await prisma.stepAttempt.findFirst({ where: { enrollmentId: data.enrollmentId, lessonId: lesson.id, stepTypeId: data.stepTypeId }, orderBy: { attemptNumber: "desc" } })
    await prisma.stepAttempt.create({ data: { enrollmentId: data.enrollmentId, lessonId: lesson.id, stepTypeId: data.stepTypeId, attemptNumber: (last?.attemptNumber ?? 0) + 1, score: data.score, passed: data.passed, answers: data.answers ?? [], startedAt: new Date(), submittedAt: new Date(), durationSec: data.durationSec } })
    await prisma.studentProgress.upsert({
      where: { enrollmentId_lessonId_stepTypeId: { enrollmentId: data.enrollmentId, lessonId: lesson.id, stepTypeId: data.stepTypeId } },
      update: { status: data.passed ? "passed" : "in_progress", bestScore: data.score, attemptCount: { increment: 1 }, firstPassedAt: data.passed ? new Date() : undefined, lastAttemptAt: new Date() },
      create: { enrollmentId: data.enrollmentId, lessonId: lesson.id, stepTypeId: data.stepTypeId, status: data.passed ? "passed" : "in_progress", bestScore: data.score, attemptCount: 1, firstPassedAt: data.passed ? new Date() : undefined, lastAttemptAt: new Date() },
    })
    if (data.passed && data.stepTypeId < 10) {
      await prisma.studentProgress.upsert({
        where: { enrollmentId_lessonId_stepTypeId: { enrollmentId: data.enrollmentId, lessonId: lesson.id, stepTypeId: data.stepTypeId + 1 } },
        update: { status: "unlocked" },
        create: { enrollmentId: data.enrollmentId, lessonId: lesson.id, stepTypeId: data.stepTypeId + 1, status: "unlocked", attemptCount: 0 },
      })
    }
    let xpResult = null
    if (data.passed) {
      const r = STEP_XP[data.stepTypeId]
      if (r) xpResult = await awardXP({ userId: session.user.id, enrollmentId: data.enrollmentId, reason: r as any, sourceId: data.unitId })
      if (data.score === 100 && PERFECT_XP[data.stepTypeId]) await awardXP({ userId: session.user.id, enrollmentId: data.enrollmentId, reason: PERFECT_XP[data.stepTypeId] as any, sourceId: data.unitId })
    }
    await updateStreak(session.user.id)
    await evaluateAchievements(session.user.id)
    const all = await prisma.studentProgress.findMany({ where: { enrollmentId: data.enrollmentId, lessonId: lesson.id } })
    const unitComplete = all.filter((p) => ["passed", "completed"].includes(p.status)).length >= 10
    if (unitComplete && data.stepTypeId === 10) xpResult = await awardXP({ userId: session.user.id, enrollmentId: data.enrollmentId, reason: "unit_complete", sourceId: data.unitId })
    return NextResponse.json({ success: true, xpResult, unitComplete })
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
