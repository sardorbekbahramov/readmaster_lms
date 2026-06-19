import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StreakCounter } from "@/components/gamification/streak-counter"
import { Zap, BookOpen, Trophy, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { xpLedger: true, streak: true, placementResult: true, achievements: { include: { achievement: true }, orderBy: { earnedAt: "desc" }, take: 6 }, enrollments: { where: { status: "active" }, include: { class: { select: { name: true } }, progress: { where: { status: { in: ["passed","completed"] } }, select: { id: true } } }, take: 1 } },
  })
  if (!user) redirect("/login")
  const enrollment = user.enrollments[0]
  const completed = enrollment?.progress.length ?? 0
  const pct = Math.round((completed / 200) * 100)
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">{user.fullName[0]?.toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Level {user.xpLedger?.currentLevel??1} · {user.xpLedger?.levelTitle??"Reader Rookie"}</Badge>
              {enrollment&&<span className="text-xs text-gray-400">{enrollment.class.name}</span>}
            </div>
          </div>
          <StreakCounter currentStreak={user.streak?.currentStreak??0} shieldsAvailable={user.streak?.shieldsAvailable??1}/>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{(user.xpLedger?.totalXp??0).toLocaleString()} XP</span><span>Next level</span></div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{width:`${Math.min(100,((user.xpLedger?.totalXp??0)%500)/5)}%`}}/></div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{label:"Total XP",value:(user.xpLedger?.totalXp??0).toLocaleString(),icon:Zap,c:"text-yellow-500 bg-yellow-50"},{label:"Steps Done",value:completed,icon:BookOpen,c:"text-blue-500 bg-blue-50"},{label:"Badges",value:user.achievements.length,icon:Trophy,c:"text-purple-500 bg-purple-50"},{label:"Day Streak",value:user.streak?.currentStreak??0,icon:Clock,c:"text-orange-500 bg-orange-50"}].map(({label,value,icon:Icon,c})=>(
          <Card key={label}><CardContent className="p-4 text-center"><div className={`inline-flex p-2 rounded-lg ${c.split(" ")[1]} mb-2`}><Icon className={`h-4 w-4 ${c.split(" ")[0]}`}/></div><div className="text-xl font-bold text-gray-900">{value}</div><div className="text-xs text-gray-400">{label}</div></CardContent></Card>
        ))}
      </div>
      <Card><CardHeader className="pb-3"><CardTitle className="text-base">Course Progress</CardTitle></CardHeader><CardContent><div className="flex justify-between text-sm mb-2"><span className="text-gray-500">{completed} / 200 steps</span><span className="font-semibold text-blue-600">{pct}%</span></div><div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width:`${pct}%`}}/></div></CardContent></Card>
      {user.placementResult&&<Card><CardHeader className="pb-3"><CardTitle className="text-base">Learning Profile</CardTitle></CardHeader><CardContent><div className="flex gap-2 mb-3"><Badge variant="outline">CEFR: {user.placementResult.estimatedCefr}</Badge><Badge variant="outline">Pace: {user.placementResult.recommendedPace}</Badge></div><p className="text-sm text-gray-600 leading-relaxed">{user.placementResult.aiProfile}</p></CardContent></Card>}
      {user.achievements.length>0&&<Card><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">Recent Badges</CardTitle><Link href="/dashboard/achievements" className="text-sm text-blue-600 hover:underline">View all →</Link></div></CardHeader><CardContent><div className="flex flex-wrap gap-3">{user.achievements.map((sa)=><div key={sa.achievementId} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-yellow-50 border border-yellow-100 w-20 text-center"><div className="text-2xl">🏅</div><p className="text-[10px] font-medium text-yellow-800 leading-tight line-clamp-2">{sa.achievement.name}</p></div>)}</div></CardContent></Card>}
      <p className="text-xs text-gray-400 text-center">Member since {formatDate(user.createdAt)}</p>
    </div>
  )
}
