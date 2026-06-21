import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
const schema = z.object({ enrollmentId: z.string().cuid(), lessonId: z.string().cuid(), stepTypeId: z.number().int().min(1).max(10) })
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const data = schema.parse(await req.json())
    const last = await prisma.stepAttempt.findFirst({ where: { enrollmentId: data.enrollmentId, lessonId: data.lessonId, stepTypeId: data.stepTypeId }, orderBy: { attemptNumber: "desc" } })
    const attempt = await prisma.stepAttempt.create({ data: { ...data, attemptNumber: (last?.attemptNumber ?? 0) + 1, startedAt: new Date() } })
    return NextResponse.json({ attemptId: attempt.id })
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }) }
}
