import { prisma } from "@/lib/db/prisma"
import { getWeekStart } from "@/lib/utils"
export async function getStudentDashboard(userId: string) {
  return prisma.enrollment.findFirst({
    where:{studentId:userId,status:"active"},
    include:{
      class:{include:{course:{include:{units:{where:{isActive:true},orderBy:{sortOrder:"asc"}}}}}},
      progress:true,
      student:{include:{xpLedger:true,streak:true,achievements:{include:{achievement:true},orderBy:{earnedAt:"desc"},take:6},notifications:{where:{isRead:false},orderBy:{createdAt:"desc"},take:5}}},
    },
  })
}
export async function getStudentUnitProgress(enrollmentId:string, unitId:string) {
  const unit = await prisma.unit.findUnique({ where:{id:unitId}, include:{lessons:true} })
  if (!unit) return null
  const lessonIds = unit.lessons.map((l) => l.id)
  const progress = await prisma.studentProgress.findMany({ where:{enrollmentId,lessonId:{in:lessonIds}} })
  return { unit, progress }
}
export async function getClassLeaderboard(classId: string) {
  const weekStart = getWeekStart()
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate()+7)
  const enrollments = await prisma.enrollment.findMany({
    where:{classId,status:"active"},
    include:{
      student:{select:{id:true,displayName:true,fullName:true,avatarUrl:true,hideFromLeaderboard:true,xpLedger:{select:{currentLevel:true,levelTitle:true}}}},
      xpEvents:{where:{occurredAt:{gte:weekStart,lt:weekEnd}},select:{xpAmount:true}},
    },
  })
  return enrollments
    .map((e) => ({
      userId:e.studentId,
      displayName:e.student.hideFromLeaderboard?"Hidden Student":(e.student.displayName??e.student.fullName),
      avatarUrl:e.student.hideFromLeaderboard?null:e.student.avatarUrl,
      level:e.student.xpLedger?.currentLevel??1,
      levelTitle:e.student.xpLedger?.levelTitle??"Reader Rookie",
      weeklyXp:e.xpEvents.reduce((s,ev)=>s+ev.xpAmount,0),
      isHidden:e.student.hideFromLeaderboard,
    }))
    .sort((a,b)=>b.weeklyXp-a.weeklyXp)
    .map((s,i)=>({...s,rank:i+1}))
}
