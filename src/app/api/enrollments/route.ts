import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
const schema = z.object({ classCode: z.string().optional(), classId: z.string().cuid().optional(), studentId: z.string().cuid().optional() })
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const data = schema.parse(await req.json())
    let classId = data.classId
    if (data.classCode) {
      const cls = await prisma.class.findFirst({ where: { classCode: data.classCode.toUpperCase(), isActive: true } })
      if (!cls) return NextResponse.json({ error: "Class code not found" }, { status: 404 })
      classId = cls.id
    }
    if (!classId) return NextResponse.json({ error: "Class required" }, { status: 400 })
    const studentId = data.studentId ?? session.user.id
    const existing = await prisma.enrollment.findUnique({ where: { classId_studentId: { classId, studentId } } })
    if (existing) return NextResponse.json({ error: "Already enrolled" }, { status: 409 })
    const enrollment = await prisma.enrollment.create({ data: { classId, studentId, enrolledBy: session.user.id } })
    return NextResponse.json(enrollment, { status: 201 })
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }) }
}
