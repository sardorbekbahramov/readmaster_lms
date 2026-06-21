import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCog, BookOpen, Zap, AlertTriangle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { formatRelativeTime, getWeekStart } from "@/lib/utils"
export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000)
  const today = new Date(); today.setUTCHours(0,0,0,0)
  const [studentCount, teacherCount, enrollmentCount, xpSum, pendingReviews, recentUsers, atRisk, unitData, aiCalls] = await Promise.all([
    prisma.userRole.count({ where: { role: "student" } }),
    prisma.userRole.count({ where: { role: "teacher" } }),
    prisma.enrollment.count({ where: { status: "active" } }),
    prisma.xpEvent.aggregate({ _sum: { xpAmount: true } }),
    prisma.writingSubmission.count({ where: { status: "manual_review" } }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 8, include: { roles: true } }),
    prisma.enrollment.findMany({ where: { status: "active", student: { OR: [{ lastLoginAt: { lt: sevenDaysAgo } }, { lastLoginAt: null }] } }, include: { student: { select: { fullName: true, email: true, lastLoginAt: true } }, class: { select: { name: true } } }, take: 8 }),
    prisma.unit.findMany({ where: { course: { isActive: true }, unitNumber: { lte: 10 } }, orderBy: { unitNumber: "asc" }, include: { lessons: { include: { _count: { select: { progress: { where: { status: { in: ["passed","completed"] }, stepTypeId: 10 } } } } } } } }),
    prisma.aiFeedbackLog.count({ where: { createdAt: { gte: today } } }),
  ])
  const totalXP = xpSum._sum.xpAmount ?? 0
  const kpis = [
    {label:"Total Students",value:studentCount,icon:Users,c:"text-blue-500 bg-blue-50"},
    {label:"Teachers",value:teacherCount,icon:UserCog,c:"text-green-500 bg-green-50"},
    {label:"Enrollments",value:enrollmentCount,icon:BookOpen,c:"text-purple-500 bg-purple-50"},
    {label:"Total XP",value:totalXP.toLocaleString(),icon:Zap,c:"text-yellow-500 bg-yellow-50"},
    {label:"Pending Reviews",value:pendingReviews,icon:AlertTriangle,c:"text-orange-500 bg-orange-50"},
    {label:"AI Calls Today",value:aiCalls,icon:TrendingUp,c:"text-teal-500 bg-teal-50"},
  ]
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1><p className="text-sm text-gray-500">Platform overview and management</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(({label,value,icon:Icon,c})=>(
          <Card key={label}><CardContent className="p-4">
            <div className={`inline-flex p-2 rounded-lg ${c.split(" ")[1]} mb-2`}><Icon className={`h-4 w-4 ${c.split(" ")[0]}`}/></div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5 leading-tight">{label}</div>
          </CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Unit Completion Rates (1–10)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {unitData.map((unit) => {
                const done = unit.lessons[0]?._count.progress ?? 0
                const pct = enrollmentCount > 0 ? Math.min(100,Math.round((done/enrollmentCount)*100)) : 0
                return (
                  <div key={unit.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-14 shrink-0">Unit {unit.unitNumber}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                      <div className={`h-full rounded flex items-center justify-end pr-2 ${pct>=70?"bg-green-400":pct>=40?"bg-blue-400":"bg-gray-300"}`} style={{width:`${Math.max(pct,4)}%`}}>
                        {pct>15&&<span className="text-[10px] text-white font-medium">{pct}%</span>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-12 shrink-0 text-right">{done} done</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-100">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500"/><CardTitle className="text-base">At-Risk Students</CardTitle><span className="ml-auto text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-full">{atRisk.length} inactive 7d+</span></div>
          </CardHeader>
          <CardContent>
            {atRisk.length===0?(
              <div className="text-center py-6"><p className="text-sm text-green-600 font-medium">✓ All students active</p></div>
            ):(
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {atRisk.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.student.fullName}</p>
                      <p className="text-xs text-orange-600">{e.student.lastLoginAt?`Last seen ${formatRelativeTime(e.student.lastLoginAt)}`:"Never logged in"} · {e.class.name}</p>
                    </div>
                    <Link href="/admin/students" className="text-xs text-orange-600 font-medium hover:underline shrink-0 ml-2">View →</Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between"><CardTitle className="text-base">Recent Signups</CardTitle><Link href="/admin/students" className="text-sm text-blue-600 hover:underline">View all →</Link></div>
        </CardHeader>
        <div className="divide-y">
          {recentUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-6 py-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">{user.fullName[0]?.toUpperCase()}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p><p className="text-xs text-gray-400 truncate">{user.email}</p></div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${user.roles[0]?.role==="admin"?"bg-purple-100 text-purple-700":user.roles[0]?.role==="teacher"?"bg-green-100 text-green-700":"bg-blue-100 text-blue-700"}`}>{user.roles[0]?.role??"student"}</span>
              <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
