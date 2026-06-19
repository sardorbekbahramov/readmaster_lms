import { prisma } from "@/lib/db/prisma"
export const XP_AMOUNTS = {
  para_correct_first:15,para_correct_second:8,para_ai_assist:3,
  reading_step_complete:30,reading_perfect:20,
  step_pass_vocab:50,perfect_score_vocab:25,step_pass_vocab_review:50,
  step_pass_comprehension:50,perfect_score_comprehension:25,
  step_pass_idioms:50,step_pass_grammar:50,perfect_score_grammar:25,
  step_pass_listening:50,step_pass_prereading:15,
  step_pass_writing:50,writing_first_pass:30,writing_excellence:40,
  unit_complete:200,unit_before_deadline:50,discussion_submitted:20,daily_login:10,
  streak_7d:100,streak_14d:250,streak_30d:500,streak_60d:1000,streak_100d:2000,
  achievement_bonus:0,comeback_step:30,
} as const
export type XpReason = keyof typeof XP_AMOUNTS
const LEVELS = [
  {level:1,title:"Reader Rookie",min:0},{level:2,title:"Word Explorer",min:500},
  {level:3,title:"Phrase Hunter",min:1500},{level:4,title:"Grammar Guard",min:3500},
  {level:5,title:"Story Master",min:7000},{level:6,title:"Book Champion",min:12000},
  {level:7,title:"Elite Scholar",min:20000},
]
export function calculateLevel(totalXp: number) {
  return [...LEVELS].reverse().find((l) => totalXp >= l.min) ?? LEVELS[0]
}
export async function awardXP({ userId, enrollmentId, reason, sourceId, overrideAmount }: {
  userId:string; enrollmentId?:string; reason:XpReason; sourceId?:string; overrideAmount?:number
}) {
  const streak = await prisma.streak.findUnique({ where:{userId} })
  const comeback = streak?.comebackActiveUntil && streak.comebackActiveUntil > new Date()
  const base = overrideAmount ?? XP_AMOUNTS[reason]
  const finalXP = comeback ? Math.floor(base*2) : base
  if (finalXP<=0) return { xpAwarded:0 }
  await prisma.xpEvent.create({ data:{userId,enrollmentId,xpAmount:finalXP,reason,sourceId} })
  const ledger = await prisma.xpLedger.upsert({
    where:{userId},
    update:{totalXp:{increment:finalXP}},
    create:{userId,totalXp:finalXP,currentLevel:1,levelTitle:"Reader Rookie"},
  })
  const newTotal = ledger.totalXp
  const newLv = calculateLevel(newTotal)
  if (newLv.level > ledger.currentLevel) {
    await prisma.xpLedger.update({ where:{userId}, data:{currentLevel:newLv.level,levelTitle:newLv.title} })
    await prisma.levelEvent.create({ data:{userId,fromLevel:ledger.currentLevel,toLevel:newLv.level,fromTitle:LEVELS[ledger.currentLevel-1]?.title??"",toTitle:newLv.title,xpAtEvent:newTotal} })
    await prisma.notification.create({ data:{userId,type:"level_up",title:"Level Up! 🎉",body:`You are now a ${newLv.title}!`,data:{newLevel:newLv.level}} })
  }
  return { xpAwarded:finalXP, newTotal, leveledUp:newLv.level>ledger.currentLevel, newLevel:newLv }
}
