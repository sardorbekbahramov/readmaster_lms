import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { LayoutList } from "lucide-react"
import Link from "next/link"
export default async function AssignmentsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const assignments = await prisma.classUnitAssignment.findMany({
    where: { class: { teacherId: session.user.id } },
    include: { class: { select: { name: true } }, unit: { select: { unitNumber: true, title: true, category: true } } },
    orderBy: { assignedAt: "desc" },
  })
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><LayoutList className="h-6 w-6 text-green-600"/><h1 className="text-2xl font-bold text-gray-900">Assignments</h1></div>
      </div>
      <div className="space-y-3">
        {assignments.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900">Unit {a.unit.unitNumber}: {a.unit.title}</p>
                <p className="text-xs text-gray-400">{a.class.name} · {a.unit.category}</p>
                {a.dueDate&&<p className="text-xs text-orange-600 mt-0.5">Due: {new Date(a.dueDate).toLocaleDateString()}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${a.isUnlocked?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{a.isUnlocked?"Unlocked":"Locked"}</span>
            </CardContent>
          </Card>
        ))}
        {assignments.length===0&&<div className="text-center py-16"><LayoutList className="h-10 w-10 text-gray-200 mx-auto mb-3"/><p className="text-gray-400 text-sm">No assignments yet. Unlock units from your class pages.</p><Link href="/teacher/classes" className="text-sm text-green-600 hover:underline mt-2 inline-block">Go to Classes →</Link></div>}
      </div>
    </div>
  )
}
