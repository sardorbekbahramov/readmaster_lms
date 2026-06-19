import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { BookOpen, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
const CAT: Record<string,string> = {"Arts and Leisure":"border-purple-200 bg-purple-50","Culture and History":"border-amber-200 bg-amber-50","Environment":"border-green-200 bg-green-50","Health":"border-red-200 bg-red-50","Science Facts":"border-blue-200 bg-blue-50","People Profiles":"border-indigo-200 bg-indigo-50","Social Science":"border-teal-200 bg-teal-50","Sports and Hobbies":"border-orange-200 bg-orange-50","Technology":"border-cyan-200 bg-cyan-50","Weird and Bizarre":"border-pink-200 bg-pink-50"}
export default async function CoursePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.enrollmentId) redirect("/dashboard")
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: session.user.enrollmentId },
    include: { class: { include: { course: { include: { units: { orderBy: { sortOrder: "asc" } } } }, unitAssignments: true } }, progress: { where: { status: { in: ["passed","completed"] } }, select: { id: true } } },
  })
  if (!enrollment) redirect("/dashboard")
  const { class: cls, progress } = enrollment
  const units = cls.course.units
  const assignmentMap = new Map(cls.unitAssignments.map((a) => [a.unitId, a]))
  const pct = Math.round((progress.length / (units.length * 10)) * 100)
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg"><BookOpen className="h-5 w-5 text-blue-600"/></div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{cls.course.title}</h1>
          <p className="text-sm text-gray-500">{cls.name} · {progress.length}/{units.length * 10} steps</p>
        </div>
        <div className="text-right"><div className="text-2xl font-bold text-blue-600">{pct}%</div><div className="text-xs text-gray-400">complete</div></div>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-8">
        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width:`${pct}%` }}/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {units.map((unit) => {
          const assignment = assignmentMap.get(unit.id)
          const isUnlocked = assignment?.isUnlocked ?? false
          const catColor = CAT[unit.category] ?? "border-gray-200 bg-white"
          return (
            <div key={unit.id} className={cn("rounded-xl border p-4 transition-all",isUnlocked?cn(catColor,"hover:shadow-md"):"border-gray-100 bg-gray-50 opacity-60")}>
              <div className="flex items-start justify-between mb-3">
                <div className={cn("flex items-center justify-center h-9 w-9 rounded-lg text-sm font-bold",isUnlocked?"bg-blue-600 text-white":"bg-gray-200 text-gray-400")}>{unit.unitNumber}</div>
                {!isUnlocked&&<Lock className="h-4 w-4 text-gray-300 mt-1"/>}
              </div>
              <h3 className={cn("font-semibold text-sm mb-1 leading-tight",isUnlocked?"text-gray-900":"text-gray-400")}>{unit.title}</h3>
              <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/70 text-gray-500 border mb-3">{unit.category}</span>
              {assignment?.dueDate&&<p className="text-[10px] text-orange-600 mb-2">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>}
              {isUnlocked&&<Link href={`/dashboard/unit/${unit.id}`} className="block w-full text-center bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors">Open →</Link>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
