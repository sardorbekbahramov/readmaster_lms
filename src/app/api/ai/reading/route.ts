import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/db/prisma"
import { getReadingAssistant } from "@/lib/ai/modules/reading-assistant"
import { z } from "zod"
const schema = z.object({ paragraphId: z.string().cuid(), questionId: z.string().cuid(), studentAnswer: z.enum(["a","b","c"]), attemptNumber: z.number().int().min(1).max(2), attemptId: z.string().optional() })
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const data = schema.parse(await req.json())
    const [paragraph, question, placement] = await Promise.all([
      prisma.paragraph.findUnique({ where: { id: data.paragraphId } }),
      prisma.question.findUnique({ where: { id: data.questionId }, include: { options: { orderBy: { sortOrder: "asc" } } } }),
      prisma.placementResult.findUnique({ where: { userId: session.user.id }, select: { estimatedCefr: true } }),
    ])
    if (!paragraph || !question) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const correctOption = question.options.find((o) => o.isCorrect)
    const studentOption = question.options.find((o) => o.optionKey === data.studentAnswer)
    const incorrectOptions = question.options.filter((o) => !o.isCorrect && o.optionKey !== data.studentAnswer).map((o) => o.optionText)
    if (!correctOption || !studentOption) return NextResponse.json({ error: "Invalid option" }, { status: 400 })
    const result = await getReadingAssistant({ paragraphText: paragraph.content, questionText: question.questionText, correctAnswerText: correctOption.optionText, studentAnswerText: studentOption.optionText, incorrectOptions, attemptNumber: data.attemptNumber as 1|2, studentCefr: placement?.estimatedCefr ?? "A2", userId: session.user.id, attemptId: data.attemptId })
    return NextResponse.json(result)
  } catch { return NextResponse.json({ error: "AI error" }, { status: 500 }) }
}
