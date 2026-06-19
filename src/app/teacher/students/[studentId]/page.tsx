import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { ArrowLeft, Zap, BookOpen, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StreakCounter } from "@/components/gamification/streak-counter"
import Link from "next/link"
import { cn } from "@/lib/utils"
const STEP_LABELS: Record<number,string> = {1:"Pre-Reading",2:"Vocabulary",3:"Reading",4:"Comprehension",5:"Idioms",6:"Grammar",7:"Listening",8:"Discussion",9:"Writing",10:"Vocab Review"}
interface Props { params: { studentId: string } }
export default async function StudentDetailPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: params.studentId, class: { teacherId: session.user.id }, status: "active" },
    include: {
      student: { include: { xpLedger: true, streak: true, placementResult: true, achievements: { include: { achievement: true }, orderBy: { earnedAt: "desc" }, take: 6 } } },
      class: { include: { course: { include: { units: { orderBy: { sortOrder: "asc" } } } } } },
      progress: true,
    },
  })
  if (!enrollment) redirect("/teacher/students")
  const { student, progress, class: cls } = enrollment
  const completedSteps = progress.filter((p) => ["passed","completed"].includes(p.status)).length
  const totalSteps = cls.course.units.length * 10
  const pct = Math.round((completedSteps / totalSteps) * 100)
  const skillScores: Record<number,number[]> = {}
  for (const p of progress) { if (p.bestScore!=null) { if (!skillScores[p.stepTypeId]) skillScores[p.stepTypeId]=[]; skillScores[p.stepTypeId].push(p.bestScore) } }
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <Link href="/teacher/students" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft className="h-4 w-4"/>Back to Students</Link>
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700">{student.fullName[0]?.toUpperCase()}</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{student.fullName}</h1>
              <p className="text-sm text-gray-500">{student.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">Level {student.xpLedger?.currentLevel??1} · {student.xpLedger?.levelTitle??"Reader Rookie"}</Badge>
                {student.placementResult&&<Badge variant="outline" className="text-xs">CEFR: {student.placementResult.estimatedCefr}</Badge>}
              </div>
            </div>
          </div>
          <StreakCounter currentStreak={student.streak?.currentStreak??0} shieldsAvailable={student.streak?.shieldsAvailable??1}/>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t">
          {[{label:"Total XP",value:(student.xpLedger?.totalXp??0).toLocaleString(),icon:Zap,c:"text-yellow-500"},{label:"Steps Done",value:`${completedSteps}/${totalSteps}`,icon:BookOpen,c:"text-blue-500"},{label:"Badges",value:student.achievements.length,icon:Trophy,c:"text-purple-500"}].map(({label,value,icon:Icon,c})=>(
            <div key={label} className="text-center"><Icon className={`h-5 w-5 mx-auto mb-1 ${c}`}/><div className="text-lg font-bold text-gray-900">{value}</div><div className="text-xs text-gray-400">{label}</div></div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Course completion</span><span className="font-semibold text-blue-600">{pct}%</span></div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width:`${pct}%`}}/></div>
        </div>
      </div>
      {Object.keys(skillScores).length > 0 && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Skill Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(skillScores).map(([typeId,scores]) => {
                const avg = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)
                return (
                  <div key={typeId} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-32 shrink-0">{STEP_LABELS[Number(typeId)]??`Step ${typeId}`}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className={cn("h-full rounded-full",avg>=70?"bg-green-400":avg>=50?"bg-yellow-400":"bg-red-400")} style={{width:`${avg}%`}}/></div>
                    <span className="text-xs font-semibold text-gray-600 w-10 text-right">{avg}%</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
      <Card><CardHeader className="pb-3"><CardTitle className="text-base">Unit Progress</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
            {cls.course.units.map((unit) => {
              const unitDone = progress.filter((p) => ["passed","completed"].includes(p.status)).length
              const unitPct = Math.round((unitDone / 10) * 100)
              return (
                <div key={unit.id} className="flex flex-col items-center gap-1">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold",unitPct===100?"bg-green-100 text-green-700":unitPct>0?"bg-blue-100 text-blue-700":"bg-gray-100 text-gray-400")}>{unit.unitNumber}</div>
                  <div className="h-1 w-8 bg-gray-100 rounded-full overflow-hidden"><div className={cn("h-full rounded-full",unitPct===100?"bg-green-400":"bg-blue-400")} style={{width:`${unitPct}%`}}/></div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      {student.achievements.length>0&&<Card><CardHeader className="pb-3"><CardTitle className="text-base">Recent Badges</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{student.achievements.map((sa)=><div key={sa.achievementId} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 border border-yellow-100"><span className="text-sm">🏅</span><span className="text-xs font-medium text-yellow-800">{sa.achievement.name}</span></div>)}</div></CardContent></Card>}
    </div>
  )
}
