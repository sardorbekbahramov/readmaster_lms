import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { UserCog } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
export default async function AdminTeachersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const teachers = await prisma.userRole.findMany({
    where: { role: "teacher" },
    include: { user: { include: { institution: { select: { name: true } }, teacherClasses: { where: { isActive: true }, include: { _count: { select: { enrollments: { where: { status: "active" } } } } } } } } },
    orderBy: { grantedAt: "desc" },
  })
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6"><UserCog className="h-6 w-6 text-purple-600"/><div><h1 className="text-2xl font-bold text-gray-900">All Teachers</h1><p className="text-sm text-gray-500">{teachers.length} teachers</p></div></div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b"><tr>{["Teacher","Institution","Classes","Students","Last Active","Status"].map((h)=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {teachers.map(({user:u})=>{
              const totalStudents = u.teacherClasses.reduce((s,c)=>s+c._count.enrollments,0)
              return (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">{u.fullName[0]?.toUpperCase()}</div><div><p className="font-medium text-sm text-gray-900">{u.fullName}</p><p className="text-xs text-gray-400">{u.email}</p></div></div></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.institution?.name??"—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.teacherClasses.length}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{totalStudents}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{u.lastLoginAt?formatRelativeTime(u.lastLoginAt):"Never"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>{u.isActive?"Active":"Suspended"}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
