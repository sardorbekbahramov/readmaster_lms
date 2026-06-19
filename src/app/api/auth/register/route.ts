import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { registerSchema } from "@/lib/validations/auth.schema"
import { createStudent, enrollInClass } from "@/lib/db/queries/user.queries"
import bcrypt from "bcryptjs"
export async function POST(req: NextRequest) {
  try {
    const data = registerSchema.parse(await req.json())
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return NextResponse.json({ error: "Email already registered." }, { status: 409 })
    const passwordHash = await bcrypt.hash(data.password, 12)
    let inst = await prisma.institution.findFirst({ where: { slug: "default" } })
    if (!inst) inst = await prisma.institution.create({ data: { name: "Default", slug: "default", institutionType: "individual" } })
    const user = await createStudent({ email: data.email, passwordHash, fullName: data.fullName, institutionId: inst.id })
    if (data.classCode) {
      const cls = await prisma.class.findFirst({ where: { classCode: data.classCode.toUpperCase(), isActive: true } })
      if (cls) { try { await enrollInClass(user.id, cls.id) } catch {} }
    }
    return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
  } catch (e: any) {
    if (e.name === "ZodError") return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    console.error("[register]", e)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
