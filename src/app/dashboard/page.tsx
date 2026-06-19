import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { getStudentDashboard } from "@/lib/db/queries/progress.queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { StreakCounter } from "@/components/gamification/streak-counter"
import { BookOpen, Zap, Trophy } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
const CAT: Record<string,string> = {"Arts and Leisure":"bg-purple-50 border-purple-200","Culture and History":"bg-amber-50 border-amber-200","Environment":"bg-green-50 border-green-200","Health":"bg-red-50 border-red-200","Science Facts":"bg-blue-50 border-blue-200","People Profiles":"bg-indigo-50 border-indigo-200","Social Science":"bg-teal-50 border-teal-200","Sports and Hobbies":"bg-orange-50 border-orange-200","Technology":"bg-cyan-50 border-cyan-200","Weird and Bizarre":"bg-pink-50 border-pink-200"}
export default async function StudentDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.enrollmentId) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <BookOpen className="h-12 w-12 text-gray-300"/>
      <h2 className="text-xl font-semibold text-gray-600">No class enrolled</h2>
      <p className="text-gray-400 text-sm">Ask your teacher for a class code.</p>
    </div>
  )
  const data = await getStudentDashboard(session.user.id)
  if (!data) redirect("/login")
  const { class: cls, progress, student } = data
  const units = cls.course.units
  const completedSteps = progress.filter((p) => ["passed","completed"].includes(p.status)).length
  const totalSteps = units.length * 10
  const pct = Math.round((completedSteps / totalSteps) * 100)
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {student.displayName??student.fullName.split(" ")[0]}!</h1>
          <p className="text-gray-500 text-sm mt-0.5">{cls.name} · {cls.course.title}</p>
        </div>
        <div className="flex items-center gap-4">
          <StreakCounter currentStreak={student.streak?.currentStreak??0} shieldsAvailable={student.streak?.shieldsAvailable??1}/>
          <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1.5">
            <Zap className="h-4 w-4 text-yellow-500"/>
            <span className="font-bold text-yellow-700 text-sm">{student.xpLedger?.totalXp??0} XP</span>
            <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">{student.xpLedger?.levelTitle??"Reader Rookie"}</Badge>
          </div>
        </div>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Course Progress</CardTitle>
            <span className="text-sm font-semibold text-blue-600">{pct}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={pct} className="h-3 mb-2"/>
          <p className="text-xs text-gray-500">{completedSteps} of {totalSteps} steps completed</p>
        </CardContent>
      </Card>
      {units[0]&&(
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Continue Learning</p>
                <h2 className="text-lg font-bold text-gray-900">Unit {units[0].unitNumber}: {units[0].title}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{units[0].category}</p>
              </div>
              <Link href={`/dashboard/unit/${units[0].id}`} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shrink-0">Continue →</Link>
            </div>
          </CardContent>
        </Card>
      )}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">All Units</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {units.map((unit)=>(
            <Link key={unit.id} href={`/dashboard/unit/${unit.id}`} className={cn("group rounded-xl border p-3 text-center transition-all hover:shadow-sm",CAT[unit.category]??"bg-white border-gray-200")}>
              <div className="text-2xl font-bold text-gray-300 mb-1">{unit.unitNumber}</div>
              <p className="text-xs font-medium text-gray-700 leading-tight line-clamp-2">{unit.title}</p>
            </Link>
          ))}
        </div>
      </div>
      {student.achievements.length>0&&(
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500"/>Recent Badges</CardTitle>
              <Link href="/dashboard/achievements" className="text-sm text-blue-600 hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {student.achievements.slice(0,6).map((sa)=>(
                <div key={sa.achievementId} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-yellow-50 border border-yellow-100 w-16">
                  <div className="text-2xl">🏅</div>
                  <span className="text-[10px] text-center text-yellow-800 font-medium leading-tight line-clamp-2">{sa.achievement.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
