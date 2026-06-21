import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Trophy } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
export default async function AchievementsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const [all, earned] = await Promise.all([
    prisma.achievement.findMany({ where: { isActive: true, isSecret: false }, orderBy: [{ category: "asc" },{ name: "asc" }] }),
    prisma.studentAchievement.findMany({ where: { userId: session.user.id }, include: { achievement: true } }),
  ])
  const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]))
  const grouped = all.reduce((acc, a) => { if (!acc[a.category]) acc[a.category]=[]; acc[a.category].push(a); return acc }, {} as Record<string,typeof all>)
  const CAT: Record<string,string> = { unit:"border-teal-200 bg-teal-50 text-teal-700", skill:"border-purple-200 bg-purple-50 text-purple-700", consistency:"border-green-200 bg-green-50 text-green-700", effort:"border-orange-200 bg-orange-50 text-orange-700", challenge:"border-red-200 bg-red-50 text-red-700" }
  const LABELS: Record<string,string> = { unit:"Unit Completion", skill:"Skill Mastery", consistency:"Consistency", effort:"Effort", challenge:"Challenge" }
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><Trophy className="h-6 w-6 text-yellow-500"/><div><h1 className="text-2xl font-bold text-gray-900">Achievements</h1><p className="text-sm text-gray-500">{earned.length} badges earned</p></div></div>
        <div className="text-right"><div className="text-2xl font-bold text-yellow-600">{earned.length}</div><div className="text-xs text-gray-400">of {all.length} total</div></div>
      </div>
      <div className="mb-8">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" style={{width:`${Math.round((earned.length/all.length)*100)}%`}}/></div>
        <p className="text-xs text-gray-400 mt-1 text-right">{Math.round((earned.length/all.length)*100)}% complete</p>
      </div>
      {Object.entries(grouped).map(([cat, achievements]) => (
        <div key={cat} className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">{LABELS[cat]??cat}</h2>
            <span className="text-xs text-gray-400">{achievements.filter((a)=>earnedMap.has(a.id)).length}/{achievements.length}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {achievements.map((a) => {
              const earnedAt = earnedMap.get(a.id)
              return (
                <div key={a.id} className={cn("relative flex flex-col items-center gap-2 p-4 rounded-xl border text-center",earnedAt?(CAT[cat]??"bg-gray-50 border-gray-200"):"bg-gray-50 border-gray-100 opacity-40 grayscale")}>
                  <div className="text-3xl">🏅</div>
                  <p className="text-xs font-semibold leading-tight">{a.name}</p>
                  <p className="text-[10px] opacity-70 leading-tight">{a.description}</p>
                  {a.xpReward>0&&<span className="text-[10px] font-bold text-yellow-600">+{a.xpReward} XP</span>}
                  {earnedAt&&<span className="text-[9px] opacity-60">{formatDate(earnedAt)}</span>}
                  {!earnedAt&&<span className="absolute top-2 right-2 text-xs">🔒</span>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
        <p className="text-2xl mb-2">🔮</p>
        <p className="text-sm font-medium text-gray-500">2 secret badges hidden</p>
        <p className="text-xs text-gray-400 mt-1">Complete special challenges to discover them</p>
      </div>
    </div>
  )
}
