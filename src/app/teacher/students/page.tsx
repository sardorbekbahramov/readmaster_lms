import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { formatRelativeTime } from "@/lib/utils"
import { Users } from "lucide-react"
import Link from "next/link"
export default async function TeacherStudentsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const enrollments = await prisma.enrollment.findMany({
    where: { class: { teacherId: session.user.id }, status: "active" },
    include: { student: { include: { xpLedger: true, streak: true } }, class: { select: { name: true } }, progress: { where: { status: { in: ["passed","completed"] } }, select: { id: true } } },
    orderBy: { enrolledAt: "desc" },
  })
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6"><Users className="h-6 w-6 text-green-600"/><div><h1 className="text-2xl font-bold text-gray-900">Students</h1><p className="text-sm text-gray-500">{enrollments.length} enrolled students</p></div></div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b"><tr>{["Student","Class","Progress","XP","Streak","Last Active",""].map((h)=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {enrollments.map((e) => {
              const pct = Math.round((e.progress.length / 200) * 100)
              return (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">{e.student.fullName[0]?.toUpperCase()}</div><div><p className="font-medium text-sm text-gray-900">{e.student.fullName}</p><p className="text-xs text-gray-400">{e.student.email}</p></div></div></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.class.name}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-400 rounded-full" style={{width:`${pct}%`}}/></div><span className="text-xs text-gray-400">{pct}%</span></div></td>
                  <td className="px-4 py-3 text-sm font-semibold text-yellow-600">{(e.student.xpLedger?.totalXp??0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-orange-600">🔥 {e.student.streak?.currentStreak??0}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{e.student.lastLoginAt?formatRelativeTime(e.student.lastLoginAt):"Never"}</td>
                  <td className="px-4 py-3"><Link href={`/teacher/students/${e.studentId}`} className="text-sm text-green-600 font-medium hover:underline">View →</Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {enrollments.length===0&&<div className="py-16 text-center"><Users className="h-10 w-10 text-gray-200 mx-auto mb-3"/><p className="text-gray-400 text-sm">No students yet</p></div>}
      </div>
    </div>
  )
}
