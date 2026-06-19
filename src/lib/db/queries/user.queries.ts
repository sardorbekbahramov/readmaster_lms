import { prisma } from "@/lib/db/prisma"
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where:{email,isActive:true}, include:{roles:true} })
}
export async function createStudent(data:{email:string;passwordHash:string;fullName:string;institutionId?:string}) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data:{...data,roles:{create:{role:"student"}}}, include:{roles:true} })
    await tx.xpLedger.create({ data:{userId:user.id,totalXp:0,currentLevel:1,levelTitle:"Reader Rookie"} })
    await tx.streak.create({ data:{userId:user.id} })
    return user
  })
}
export async function enrollInClass(studentId:string, classId:string, enrolledBy?:string) {
  const cls = await prisma.class.findUnique({ where:{id:classId,isActive:true}, include:{_count:{select:{enrollments:{where:{status:"active"}}}}} })
  if (!cls) throw new Error("Class not found")
  if (cls._count.enrollments>=cls.maxStudents) throw new Error("Class is full")
  return prisma.enrollment.create({ data:{classId,studentId,enrolledBy} })
}
