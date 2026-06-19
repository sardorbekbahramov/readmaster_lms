import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { BookOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
export default async function AdminBooksPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const courses = await prisma.course.findMany({ include: { _count: { select: { units: true, classes: true } } }, orderBy: { createdAt: "asc" } })
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6"><BookOpen className="h-6 w-6 text-purple-600"/><h1 className="text-2xl font-bold text-gray-900">Course Books</h1></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {courses.map((course) => (
          <Card key={course.id} className="hover:border-purple-200 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-purple-100 rounded-xl shrink-0"><BookOpen className="h-6 w-6 text-purple-600"/></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{course.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{course.author}</p>
                  {course.publisher&&<p className="text-xs text-gray-400">{course.publisher}{course.edition>1?`, ${course.edition}th ed.`:""}</p>}
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{course._count.units} units</span>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{course._count.classes} classes</span>
                    {course.cefrLevel&&<span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{course.cefrLevel}</span>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${course.isActive?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{course.isActive?"Active":"Inactive"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
