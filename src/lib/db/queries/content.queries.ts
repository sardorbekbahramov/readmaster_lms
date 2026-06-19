import { prisma } from "@/lib/db/prisma"
export async function getAllCourses() {
  return prisma.course.findMany({ where:{isActive:true}, include:{_count:{select:{units:true,classes:true}}}, orderBy:{createdAt:"asc"} })
}
export async function getUnitsByClass(classId: string) {
  return prisma.classUnitAssignment.findMany({ where:{classId}, include:{unit:{include:{lessons:{select:{id:true}}}}}, orderBy:{unit:{sortOrder:"asc"}} })
}
