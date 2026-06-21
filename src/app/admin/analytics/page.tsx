import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, Zap } from "lucide-react"
import { getWeekStart } from "@/lib/utils"
export default async function AdminAnalyticsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const weekStart = getWeekStart()
  const weeklyXpData = await Promise.all(
    Array.from({length:8},(_,i)=>{
      const ws=new Date(weekStart); ws.setDate(ws.getDate()-i*7)
      const we=new Date(ws); we.setDate(we.getDate()+7)
      return prisma.xpEvent.aggregate({where:{occurredAt:{gte:ws,lt:we}},_sum:{xpAmount:true}})
        .then((r)=>({week:ws.toLocaleDateString("en",{month:"short",day:"numeric"}),xp:r._sum.xpAmount??0}))
    })
  )
  weeklyXpData.reverse()
  const maxXp = Math.max(...weeklyXpData.map((w)=>w.xp),1)
  const [totalSteps,avgScore,totalWriting,aiTokens] = await Promise.all([
    prisma.stepAttempt.count({where:{passed:true}}),
    prisma.stepAttempt.aggregate({where:{passed:true,score:{not:null}},_avg:{score:true}}),
    prisma.writingSubmission.count(),
    prisma.aiFeedbackLog.aggregate({_sum:{tokensUsed:true}}),
  ])
  const STEP_NAMES: Record<number,string> = {2:"Vocabulary",4:"Comprehension",5:"Idioms",6:"Grammar",7:"Listening",9:"Writing",10:"Vocab Review"}
  const scores = await prisma.stepAttempt.groupBy({by:["stepTypeId"],where:{passed:true,score:{not:null}},_avg:{score:true},_count:{id:true}})
  const kpis = [
    {label:"Steps Completed",value:totalSteps.toLocaleString(),icon:TrendingUp,c:"text-blue-500"},
    {label:"Avg Step Score",value:`${Math.round(avgScore._avg.score??0)}%`,icon:BarChart3,c:"text-green-500"},
    {label:"Writing Submissions",value:totalWriting.toLocaleString(),icon:Users,c:"text-purple-500"},
    {label:"Total AI Tokens",value:`${((aiTokens._sum.tokensUsed??0)/1000).toFixed(0)}K`,icon:Zap,c:"text-orange-500"},
  ]
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1><p className="text-sm text-gray-500">Platform-wide usage and learning outcomes</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpis.map(({label,value,icon:Icon,c})=>(
          <Card key={label}><CardContent className="p-4"><Icon className={`h-5 w-5 ${c} mb-2`}/><div className="text-2xl font-bold text-gray-900">{value}</div><div className="text-xs text-gray-400 mt-0.5">{label}</div></CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Weekly XP Trend (Last 8 Weeks)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {weeklyXpData.map((week)=>{
              const h = Math.max(8,Math.round((week.xp/maxXp)*100))
              return (
                <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">{week.xp>0?(week.xp/1000).toFixed(1)+"K":"0"}</span>
                  <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors" style={{height:`${h}%`}}/>
                  <span className="text-[9px] text-gray-400 text-center leading-tight">{week.week}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Avg Score by Step Type</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {scores.filter((s)=>STEP_NAMES[s.stepTypeId]).map((s)=>{
              const avg = Math.round(s._avg.score??0)
              return (
                <div key={s.stepTypeId} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-36 shrink-0">{STEP_NAMES[s.stepTypeId]}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden"><div className={`h-full rounded transition-all ${avg>=80?"bg-green-400":avg>=60?"bg-blue-400":"bg-orange-400"}`} style={{width:`${avg}%`}}/></div>
                  <span className="text-xs font-semibold text-gray-600 w-10 text-right">{avg}%</span>
                  <span className="text-xs text-gray-400 w-14 text-right">{s._count.id} attempts</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
