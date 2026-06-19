import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { getClassLeaderboard } from "@/lib/db/queries/progress.queries"
import { prisma } from "@/lib/db/prisma"
import { Trophy, Crown, Medal } from "lucide-react"
import { cn } from "@/lib/utils"
export default async function LeaderboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.enrollmentId) redirect("/dashboard")
  const enrollment = await prisma.enrollment.findUnique({ where: { id: session.user.enrollmentId }, include: { class: { select: { id: true, name: true, leaderboardVisible: true } } } })
  if (!enrollment?.class.leaderboardVisible) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Trophy className="h-12 w-12 text-gray-300"/>
      <p className="text-gray-500 text-sm">Leaderboard is hidden for this class.</p>
    </div>
  )
  const rankings = await getClassLeaderboard(enrollment.class.id)
  const myRank = rankings.find((r) => r.userId === session.user.id)
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2"><Trophy className="h-6 w-6 text-yellow-500"/><div><h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1><p className="text-sm text-gray-500">{enrollment.class.name} · This week</p></div></div>
      <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 flex items-center gap-2">🔄 Rankings reset every Monday — fresh start for everyone!</div>
      {myRank && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
          <span className="font-bold text-yellow-600">Your rank: #{myRank.rank}</span>
          <span className="text-sm text-gray-600">{myRank.weeklyXp} XP this week</span>
          {myRank.rank === 1 && <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-medium">👑 Top!</span>}
        </div>
      )}
      {rankings.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-6">
          {[rankings[1], rankings[0], rankings[2]].filter(Boolean).map((r) => {
            const idx = r.rank===1?0:r.rank===2?1:2
            const heights = ["h-20","h-28","h-16"]
            const colors = ["bg-gray-50 border-gray-200","bg-yellow-50 border-yellow-200","bg-amber-50 border-amber-200"]
            const icons = [Medal,Crown,Medal]
            const iconColors = ["text-gray-400","text-yellow-500","text-amber-600"]
            const Icon = icons[idx]
            return (
              <div key={r.userId} className="flex flex-col items-center gap-2 flex-1">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">{r.displayName[0]?.toUpperCase()}</div>
                <p className="text-xs font-semibold text-gray-700 text-center truncate w-full px-1">{r.displayName}</p>
                <p className="text-xs text-gray-400">{r.weeklyXp} XP</p>
                <div className={cn("w-full rounded-t-xl border-2 flex items-end justify-center pb-3",heights[idx],colors[idx])}><Icon className={cn("h-5 w-5",iconColors[idx])}/></div>
              </div>
            )
          })}
        </div>
      )}
      <div className="space-y-2">
        {rankings.map((r) => {
          const isMe = r.userId === session.user.id
          return (
            <div key={r.userId} className={cn("flex items-center gap-4 px-4 py-3 rounded-xl border",isMe?"border-blue-300 bg-blue-50 ring-1 ring-blue-200":"border-gray-100 bg-white")}>
              <span className={cn("w-7 text-center font-bold text-sm",r.rank===1?"text-yellow-500":r.rank===2?"text-gray-400":r.rank===3?"text-amber-600":"text-gray-300")}>#{r.rank}</span>
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">{r.displayName[0]?.toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{r.displayName}{isMe&&<span className="ml-2 text-xs text-blue-500 font-normal">(you)</span>}</p>
                <p className="text-xs text-gray-400">Level {r.level} · {r.levelTitle}</p>
              </div>
              <span className="font-bold text-sm text-blue-700">{r.weeklyXp} XP</span>
            </div>
          )
        })}
        {rankings.length===0&&<div className="text-center py-12"><Trophy className="h-10 w-10 text-gray-200 mx-auto mb-3"/><p className="text-gray-400 text-sm">No activity yet — be the first!</p></div>}
      </div>
      <p className="mt-4 text-center text-xs text-gray-400">🔒 Rankings are visible only to your classmates.</p>
    </div>
  )
}
