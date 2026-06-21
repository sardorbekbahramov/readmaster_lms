import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import { getWeekStart } from "@/lib/utils"
export default async function TeacherAnalyticsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const weekStart = getWeekStart()
  const classes = await prisma.class.findMany({
    where: { teacherId: session.user.id, isActive: true },
    include: { course: { select: { title: true } }, enrollments: { where: { status: "active" }, include: { progress: { where: { status: { in: ["passed","completed"] } }, select: { stepTypeId: true } }, xpEvents: { where: { occurredAt: { gte: weekStart } }, select: { xpAmount: true } } } } },
  })
  const STEP_NAMES: Record<number,string> = {2:"Vocabulary",4:"Comprehension",5:"Idioms",6:"Grammar",7:"Listening",9:"Writing",10:"Vocab Review"}
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3"><BarChart3 className="h-6 w-6 text-green-600"/><h1 className="text-2xl font-bold text-gray-900">Analytics</h1></div>
      {classes.map((cls) => {
        const total = cls.enrollments.length
        const weeklyXp = cls.enrollments.reduce((s,e)=>s+e.xpEvents.reduce((xs,x)=>xs+x.xpAmount,0),0)
        const avgXp = total > 0 ? Math.round(weeklyXp / total) : 0
        const stepCounts: Record<number,number> = {}
        for (const e of cls.enrollments) for (const p of e.progress) { stepCounts[p.stepTypeId]=(stepCounts[p.stepTypeId]??0)+1 }
        return (
          <div key={cls.id} className="space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">{cls.name}</h2><span className="text-sm text-gray-400">{cls.course.title}</span></div>
            <div className="grid grid-cols-3 gap-3">
              {[{l:"Students",v:total},{l:"Avg XP / Week",v:avgXp},{l:"Total XP (week)",v:weeklyXp.toLocaleString()}].map(({l,v})=>(
                <Card key={l}><CardContent className="p-3 text-center"><div className="text-xl font-bold text-gray-900">{v}</div><div className="text-xs text-gray-400">{l}</div></CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Step Completion Rates</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(STEP_NAMES).map(([typeId,name]) => {
                    const count = stepCounts[Number(typeId)]??0
                    const pct = total > 0 ? Math.min(100,Math.round((count/total)*100)) : 0
                    return (
                      <div key={typeId} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-28 shrink-0">{name}</span>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${pct>=70?"bg-green-400":pct>=40?"bg-blue-400":"bg-gray-300"}`} style={{width:`${pct}%`}}/></div>
                        <span className="text-xs font-semibold text-gray-500 w-8 text-right">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })}
      {classes.length===0&&<div className="text-center py-16 text-gray-400"><BarChart3 className="h-10 w-10 mx-auto mb-3 text-gray-200"/><p className="text-sm">No classes yet.</p></div>}
    </div>
  )
}
