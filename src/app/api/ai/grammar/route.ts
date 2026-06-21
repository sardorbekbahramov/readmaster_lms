import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { getGrammarCoach } from "@/lib/ai/modules/grammar-coach"
import { z } from "zod"
const schema = z.object({ grammarTopicName: z.string(), ruleExplanation: z.string(), questionText: z.string(), correctAnswer: z.string(), studentAnswer: z.string(), passageContext: z.string().optional().default("") })
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const data = schema.parse(await req.json())
    const placement = await prisma.placementResult.findUnique({ where: { userId: session.user.id }, select: { estimatedCefr: true } })
    const result = await getGrammarCoach({ grammarTopic: data.grammarTopicName, ruleExplanation: data.ruleExplanation, exerciseSentence: data.questionText, correctAnswer: data.correctAnswer, studentAnswer: data.studentAnswer, passageContext: data.passageContext, studentCefr: placement?.estimatedCefr ?? "A2", userId: session.user.id })
    return NextResponse.json(result)
  } catch { return NextResponse.json({ error: "AI error" }, { status: 500 }) }
}
