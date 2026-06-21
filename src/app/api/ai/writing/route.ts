import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { evaluateWriting } from "@/lib/ai/modules/writing-evaluator"
import { writingSubmitSchema } from "@/lib/validations/progress.schema"
import { awardXP } from "@/lib/gamification/xp.service"
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const data = writingSubmitSchema.parse(await req.json())
    const [writingTask, unit, placement] = await Promise.all([
      prisma.writingTask.findUnique({ where: { unitId: data.unitId } }),
      prisma.unit.findUnique({ where: { id: data.unitId }, include: { vocabulary: { where: { stepTypeId: 2 } } } }),
      prisma.placementResult.findUnique({ where: { userId: session.user.id }, select: { estimatedCefr: true } }),
    ])
    if (!writingTask || !unit) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const evaluation = await evaluateWriting({ studentText: data.text, writingTopic: writingTask.topic, guideQuestions: (writingTask.guideQuestions as string[]) ?? [], targetVocabulary: unit.vocabulary.map((v) => v.word), studentCefr: placement?.estimatedCefr ?? "A2", attemptNumber: data.attemptNumber, userId: session.user.id, attemptId: data.stepAttemptId })
    await prisma.writingSubmission.create({ data: { attemptId: data.stepAttemptId, aiScoreContent: evaluation.scoreContent, aiScoreStructure: evaluation.scoreStructure, aiScoreGrammar: evaluation.scoreGrammar, aiScoreVocab: evaluation.scoreVocab, aiTotal: evaluation.totalScore, aiFeedback: evaluation.narrativeFeedback, aiSuggestions: evaluation.suggestions, status: evaluation.flagForTeacher ? "manual_review" : "ai_draft" } })
    await prisma.stepAttempt.update({ where: { id: data.stepAttemptId }, data: { score: (evaluation.totalScore / 10) * 100, passed: evaluation.pass, submittedAt: new Date(), submissionText: data.text } })
    let xpResult = null
    if (evaluation.pass) {
      xpResult = await awardXP({ userId: session.user.id, enrollmentId: data.enrollmentId, reason: "step_pass_writing", sourceId: data.unitId })
      if (data.attemptNumber === 1) await awardXP({ userId: session.user.id, enrollmentId: data.enrollmentId, reason: "writing_first_pass", sourceId: data.unitId })
      if (evaluation.totalScore >= 9) await awardXP({ userId: session.user.id, enrollmentId: data.enrollmentId, reason: "writing_excellence", sourceId: data.unitId })
    }
    if (evaluation.flagForTeacher) {
      const enrollment = await prisma.enrollment.findUnique({ where: { id: data.enrollmentId }, include: { class: { select: { teacherId: true } } } })
      if (enrollment?.class.teacherId) await prisma.notification.create({ data: { userId: enrollment.class.teacherId, type: "writing_needs_review", title: "Writing Needs Review", body: `A student's writing scored ${evaluation.totalScore}/10.` } })
    }
    return NextResponse.json({ evaluation, xpResult })
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
