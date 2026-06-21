import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { nanoid } from "nanoid"
const createSchema = z.object({ name: z.string().min(2).max(100), courseId: z.string().cuid(), unlockMode: z.enum(["sequential","open","manual"]).default("sequential"), maxStudents: z.number().int().min(1).max(100).default(30) })
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const classes = await prisma.class.findMany({ where: { teacherId: session.user.id, isActive: true }, include: { course: { select: { title: true } }, _count: { select: { enrollments: { where: { status: "active" } } } } }, orderBy: { createdAt: "desc" } })
    return NextResponse.json(classes)
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }) }
}
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !["teacher","admin"].includes(session.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const data = createSchema.parse(await req.json())
    let inst = await prisma.institution.findFirst({ where: { users: { some: { id: session.user.id } } } })
    if (!inst) inst = await prisma.institution.findFirst({ where: { slug: "default" } })
    if (!inst) inst = await prisma.institution.create({ data: { name: "Default", slug: "default", institutionType: "individual" } })
    const cls = await prisma.class.create({ data: { institutionId: inst.id, teacherId: session.user.id, courseId: data.courseId, name: data.name, classCode: nanoid(8).toUpperCase(), maxStudents: data.maxStudents, unlockMode: data.unlockMode } })
    return NextResponse.json(cls, { status: 201 })
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
