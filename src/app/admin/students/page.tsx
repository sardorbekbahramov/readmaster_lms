import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Users } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
export default async function AdminStudentsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const students = await prisma.userRole.findMany({
    where: { role: "student" },
    include: { user: { include: { xpLedger: true, streak: true, enrollments: { where: { status: "active" }, include: { class: { select: { name: true } } }, take: 1 } } } },
    orderBy: { grantedAt: "desc" },
  })
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6"><Users className="h-6 w-6 text-purple-600"/><div><h1 className="text-2xl font-bold text-gray-900">All Students</h1><p className="text-sm text-gray-500">{students.length} total students</p></div></div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b"><tr>{["Student","Class","XP","Level","Streak","Last Active","Status"].map((h)=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {students.map(({user:u})=>(
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">{u.fullName[0]?.toUpperCase()}</div><div><p className="font-medium text-sm text-gray-900">{u.fullName}</p><p className="text-xs text-gray-400">{u.email}</p></div></div></td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.enrollments[0]?.class.name??"—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-yellow-600">{(u.xpLedger?.totalXp??0).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-600">Lv.{u.xpLedger?.currentLevel??1}</td>
                <td className="px-4 py-3 text-sm text-orange-600">🔥 {u.streak?.currentStreak??0}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{u.lastLoginAt?formatRelativeTime(u.lastLoginAt):"Never"}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>{u.isActive?"Active":"Suspended"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length===0&&<div className="py-16 text-center"><Users className="h-10 w-10 text-gray-200 mx-auto mb-3"/><p className="text-gray-400 text-sm">No students yet</p></div>}
      </div>
    </div>
  )
}
