import { groq, BASE_CONFIG } from "@/lib/ai/groq"
import { sanitizeJsonResponse } from "@/lib/ai/sanitize"
import { prisma } from "@/lib/db/prisma"
import { getWeekStart } from "@/lib/utils"
export async function generateWeeklyInsight(input:{userId:string;enrollmentId:string}):Promise<void>{
  const ws=getWeekStart(),lws=new Date(ws);lws.setDate(lws.getDate()-7)
  const [tw,lw,steps,streak]=await Promise.all([
    prisma.xpEvent.aggregate({where:{enrollmentId:input.enrollmentId,occurredAt:{gte:ws}},_sum:{xpAmount:true}}),
    prisma.xpEvent.aggregate({where:{enrollmentId:input.enrollmentId,occurredAt:{gte:lws,lt:ws}},_sum:{xpAmount:true}}),
    prisma.stepAttempt.count({where:{enrollmentId:input.enrollmentId,passed:true,submittedAt:{gte:ws}}}),
    prisma.streak.findUnique({where:{userId:input.userId}}),
  ])
  const xpThis=tw._sum.xpAmount??0,xpLast=lw._sum.xpAmount??0
  if(xpThis===0){await prisma.notification.create({data:{userId:input.userId,type:"weekly_digest",title:"We missed you!",body:"Come back for double XP!"}});return}
  try{
    const completion=await groq.chat.completions.create({...BASE_CONFIG,max_tokens:300,messages:[
      {role:"system",content:`Learning progress coach. Write 70-90 word weekly summary. Direct and data-driven. NEVER say "Amazing week!". Return JSON: {"insightText":"...","focusArea":"...","nextStepSuggestion":"...","motivationSignal":"on_track"|"needs_push"|"excellent"}`},
      {role:"user",content:`XP this week: ${xpThis} (${xpThis>xpLast?"up":"down"} from ${xpLast}). Steps: ${steps}. Streak: ${streak?.currentStreak??0} days.`},
    ]})
    const raw=completion.choices[0]?.message?.content??""
    const parsed=JSON.parse(sanitizeJsonResponse(raw))
    await prisma.notification.create({data:{userId:input.userId,type:"weekly_digest",title:"Your Weekly Summary",body:parsed.insightText,data:{focusArea:parsed.focusArea,nextStep:parsed.nextStepSuggestion}}})
  }catch{await prisma.notification.create({data:{userId:input.userId,type:"weekly_digest",title:"Weekly Summary",body:`You earned ${xpThis} XP this week. Keep going!`}})}
}
