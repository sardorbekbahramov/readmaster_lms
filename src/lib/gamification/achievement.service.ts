import { prisma } from "@/lib/db/prisma"
import { awardXP } from "./xp.service"
export async function evaluateAchievements(userId: string): Promise<void> {
  const [achievements, earned] = await Promise.all([
    prisma.achievement.findMany({ where:{isActive:true} }),
    prisma.studentAchievement.findMany({ where:{userId}, select:{achievementId:true} }),
  ])
  const earnedIds = new Set(earned.map((e) => e.achievementId))
  for (const a of achievements) {
    if (earnedIds.has(a.id)) continue
    const rule = a.triggerRule as Record<string,unknown>
    const qualifies = await checkRule(userId, rule)
    if (!qualifies) continue
    await prisma.$transaction(async (tx) => {
      await tx.achievementEvent.create({ data:{userId,achievementId:a.id} })
      await tx.studentAchievement.create({ data:{userId,achievementId:a.id} })
      await tx.notification.create({ data:{userId,type:"badge_earned",title:`Badge: ${a.name} 🏅`,body:a.description} })
    })
    if (a.xpReward>0) await awardXP({ userId, reason:"achievement_bonus", overrideAmount:a.xpReward, sourceId:a.id })
  }
}
async function checkRule(userId: string, rule: Record<string,unknown>): Promise<boolean> {
  if (rule.type==="streak_milestone") {
    const s = await prisma.streak.findUnique({ where:{userId} })
    return (s?.currentStreak??0) >= (rule.days as number)
  }
  if (rule.type==="pass_after_fails") {
    const groups = await prisma.stepAttempt.groupBy({
      by:["lessonId","stepTypeId"], where:{enrollment:{studentId:userId}},
      _count:{id:true}, having:{id:{_count:{gte:(rule.min_fails as number)+1}}},
    })
    for (const g of groups) {
      const last = await prisma.stepAttempt.findFirst({ where:{enrollment:{studentId:userId},lessonId:g.lessonId,stepTypeId:g.stepTypeId}, orderBy:{attemptNumber:"desc"} })
      if (last?.passed) return true
    }
    return false
  }
  return false
}
