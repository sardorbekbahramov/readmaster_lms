import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { FileText, CheckCircle, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
export default async function AdminContentPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const courses = await prisma.course.findMany({ include: { units: { orderBy: { sortOrder: "asc" }, include: { _count: { select: { paragraphs: true, vocabulary: true } }, lessons: { include: { _count: { select: { questions: true } } } }, grammarTopic: { select: { id: true } }, writingTask: { select: { id: true } }, listeningTask: { select: { id: true } } } }, _count: { select: { units: true } } } })
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6"><FileText className="h-6 w-6 text-purple-600"/><h1 className="text-2xl font-bold text-gray-900">Content Management</h1></div>
      {courses.map((course) => (
        <div key={course.id} className="mb-8">
          <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-bold text-gray-900">{course.title}</h2><span className="text-sm text-gray-400">{course._count.units} units</span></div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr>{["Unit","Paragraphs","Vocab","Questions","Grammar","Writing","Audio","Status"].map((h)=><th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {course.units.map((unit) => {
                  const q = unit.lessons[0]?._count.questions??0
                  const hasG = !!unit.grammarTopic; const hasW = !!unit.writingTask; const hasA = !!unit.listeningTask?.id
                  const ok = unit._count.paragraphs>0&&unit._count.vocabulary>0&&q>0&&hasG&&hasW
                  return (
                    <tr key={unit.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5"><div className="flex items-center gap-2"><span className="text-xs font-bold text-gray-400 w-5">#{unit.unitNumber}</span><span className="font-medium text-sm text-gray-900 truncate max-w-[140px]">{unit.title}</span></div></td>
                      <td className="px-3 py-2.5"><span className={cn("text-sm font-medium",unit._count.paragraphs>0?"text-green-600":"text-red-400")}>{unit._count.paragraphs}</span></td>
                      <td className="px-3 py-2.5"><span className={cn("text-sm font-medium",unit._count.vocabulary>0?"text-green-600":"text-red-400")}>{unit._count.vocabulary}</span></td>
                      <td className="px-3 py-2.5"><span className={cn("text-sm font-medium",q>0?"text-green-600":"text-red-400")}>{q}</span></td>
                      <td className="px-3 py-2.5">{hasG?<CheckCircle className="h-4 w-4 text-green-500"/>:<Circle className="h-4 w-4 text-gray-300"/>}</td>
                      <td className="px-3 py-2.5">{hasW?<CheckCircle className="h-4 w-4 text-green-500"/>:<Circle className="h-4 w-4 text-gray-300"/>}</td>
                      <td className="px-3 py-2.5">{hasA?<CheckCircle className="h-4 w-4 text-green-500"/>:<Circle className="h-4 w-4 text-gray-300"/>}</td>
                      <td className="px-3 py-2.5"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",ok?"bg-green-100 text-green-700":"bg-yellow-100 text-yellow-700")}>{ok?"Ready":"Incomplete"}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
