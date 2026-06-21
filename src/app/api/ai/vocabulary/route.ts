import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { getVocabularyCoach } from "@/lib/ai/modules/vocabulary-coach"
import { z } from "zod"
const schema = z.object({ failedWords: z.array(z.object({ word: z.string(), definition: z.string() })), unitTopic: z.string() })
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const data = schema.parse(await req.json())
    const placement = await prisma.placementResult.findUnique({ where: { userId: session.user.id }, select: { estimatedCefr: true } })
    const result = await getVocabularyCoach({ failedWords: data.failedWords, unitTopic: data.unitTopic, studentCefr: placement?.estimatedCefr ?? "A2", userId: session.user.id })
    return NextResponse.json(result)
  } catch { return NextResponse.json({ error: "AI error" }, { status: 500 }) }
}
