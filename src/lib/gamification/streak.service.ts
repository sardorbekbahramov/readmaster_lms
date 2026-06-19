import { prisma } from "@/lib/db/prisma"
import type { XpReason } from "./xp.service"
export async function updateStreak(userId: string): Promise<void> {
  const today = new Date(); today.setUTCHours(0,0,0,0)
  const streak = await prisma.streak.findUnique({ where:{userId} })
  if (!streak) return
  const last = streak.lastActiveDate ? new Date(streak.lastActiveDate) : null
  if (last) { last.setUTCHours(0,0,0,0); if (Math.floor((today.getTime()-last.getTime())/86400000)===0) return }
  const newStreak = streak.currentStreak+1
  await prisma.streak.update({ where:{userId}, data:{currentStreak:{increment:1},lastActiveDate:today,longestStreak:{set:Math.max(streak.longestStreak,newStreak)}} })
  const milestones: Record<number,string> = {7:"streak_7d",14:"streak_14d",30:"streak_30d",60:"streak_60d",100:"streak_100d"}
  if (milestones[newStreak]) {
    const { awardXP } = await import("./xp.service")
    await awardXP({ userId, reason:milestones[newStreak] as XpReason })
  }
}
export async function checkAndBreakStreak(userId: string): Promise<void> {
  const streak = await prisma.streak.findUnique({ where:{userId} })
  if (!streak||streak.currentStreak===0) return
  const today = new Date(); today.setUTCHours(0,0,0,0)
  const last = streak.lastActiveDate ? new Date(streak.lastActiveDate) : null
  if (!last) return
  last.setUTCHours(0,0,0,0)
  const diff = Math.floor((today.getTime()-last.getTime())/86400000)
  if (diff<=1) return
  if (diff===2 && streak.shieldsAvailable>0) {
    await prisma.streak.update({ where:{userId}, data:{shieldsAvailable:{decrement:1},lastActiveDate:today} })
    return
  }
  const broken = streak.currentStreak
  await prisma.streak.update({ where:{userId}, data:{currentStreak:0,lastActiveDate:null,comebackActiveUntil:new Date(Date.now()+48*3600000)} })
  await prisma.notification.create({ data:{userId,type:"streak_broken",title:"Streak Ended",body:`Your ${broken}-day streak ended. Get 2× XP for 48 hours!`} })
}
