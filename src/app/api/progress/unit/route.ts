import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
const schema = z.object({ enrollmentId: z.string().cuid(), unitId: z.string().cuid() })
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = req.nextUrl
    const enrollmentId = searchParams.get("enrollmentId")
    const unitId = searchParams.get("unitId")
    if (!enrollmentId || !unitId) return NextResponse.json({ error: "Missing params" }, { status: 400 })
    const unit = await prisma.unit.findUnique({ where: { id: unitId }, include: { lessons: true } })
    if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const lessonIds = unit.lessons.map((l) => l.id)
    const progress = await prisma.studentProgress.findMany({ where: { enrollmentId, lessonId: { in: lessonIds } } })
    return NextResponse.json({ unit, progress })
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }) }
}
