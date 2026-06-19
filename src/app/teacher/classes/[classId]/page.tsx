import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { cn } from "@/lib/utils"
interface Props { params: { classId: string } }
export default async function ClassDetailPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const cls = await prisma.class.findFirst({
    where: { id: params.classId, teacherId: session.user.id },
    include: {
      course: { include: { units: { orderBy: { sortOrder: "asc" } } } },
      enrollments: { where: { status: "active" }, include: { student: { select: { id: true, fullName: true, email: true, lastLoginAt: true, xpLedger: true } }, progress: { where: { status: { in: ["passed","completed"] } }, select: { id: true } } } },
      unitAssignments: true,
    },
  })
  if (!cls) redirect("/teacher/classes")
  const assignmentMap = new Map(cls.unitAssignments.map((a) => [a.unitId, a]))
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <Link href="/teacher/classes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft className="h-4 w-4"/>Back to Classes</Link>
      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-start justify-between">
          <div><h1 className="text-xl font-bold text-gray-900">{cls.name}</h1><p className="text-sm text-gray-500 mt-0.5">{cls.course.title} · {cls.enrollments.length} students</p></div>
          <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2"><span className="text-xs text-gray-400">Class Code</span><span className="font-mono font-bold text-gray-900">{cls.classCode}</span></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Unit Access Control</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {cls.course.units.map((unit) => {
                const a = assignmentMap.get(unit.id)
                const isUnlocked = a?.isUnlocked ?? false
                return (
                  <div key={unit.id} className={cn("flex items-center justify-between px-3 py-2 rounded-lg border text-sm",isUnlocked?"bg-green-50 border-green-200":"bg-gray-50 border-gray-100")}>
                    <span className={cn("font-medium",isUnlocked?"text-green-800":"text-gray-500")}>Unit {unit.unitNumber}: {unit.title}</span>
                    <span className={cn("text-xs px-2 py-1 rounded-full font-medium",isUnlocked?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500")}>{isUnlocked?"Unlocked":"Locked"}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">Students ({cls.enrollments.length})</CardTitle></div></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {cls.enrollments.map((e) => {
                const pct = Math.round((e.progress.length / 200) * 100)
                return (
                  <Link key={e.id} href={`/teacher/students/${e.studentId}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">{e.student.fullName[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.student.fullName}</p>
                      <div className="flex items-center gap-2 mt-0.5"><div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-400 rounded-full" style={{width:`${pct}%`}}/></div><span className="text-xs text-gray-400 shrink-0">{pct}%</span></div>
                    </div>
                    <span className="text-xs font-semibold text-yellow-600">{e.student.xpLedger?.totalXp??0} XP</span>
                  </Link>
                )
              })}
              {cls.enrollments.length===0&&<p className="text-sm text-gray-400 text-center py-4">No students yet. Share code: <span className="font-mono font-bold">{cls.classCode}</span></p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
