import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { LayoutList } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
export default async function ClassesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const classes = await prisma.class.findMany({
    where: { teacherId: session.user.id },
    include: { course: { select: { title: true } }, _count: { select: { enrollments: { where: { status: "active" } } } } },
    orderBy: { createdAt: "desc" },
  })
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><LayoutList className="h-6 w-6 text-green-600"/><h1 className="text-2xl font-bold text-gray-900">My Classes</h1></div>
        <Link href="/teacher/classes/new" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">+ Create Class</Link>
      </div>
      <div className="space-y-3">
        {classes.map((cls) => (
          <Card key={cls.id} className="hover:border-green-200 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls.isActive?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{cls.isActive?"Active":"Archived"}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{cls.course.title} · {cls._count.enrollments} students</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Code: <span className="font-mono font-bold text-gray-700">{cls.classCode}</span></span>
                    <span>Created: {formatDate(cls.createdAt)}</span>
                    <span>Mode: {cls.unlockMode}</span>
                  </div>
                </div>
                <Link href={`/teacher/classes/${cls.id}`} className="px-3 py-1.5 text-sm text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors ml-4">Manage →</Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {classes.length === 0 && (
          <div className="py-20 text-center">
            <LayoutList className="h-12 w-12 text-gray-200 mx-auto mb-3"/>
            <p className="text-gray-500 font-medium">No classes yet</p>
            <p className="text-gray-400 text-sm mb-4">Create your first class to start teaching</p>
            <Link href="/teacher/classes/new" className="inline-block bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700">Create First Class</Link>
          </div>
        )}
      </div>
    </div>
  )
}
