import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Users, BookOpen, AlertCircle } from "lucide-react"
import Link from "next/link"
export default async function TeacherDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const [classes, flagged] = await Promise.all([
    prisma.class.findMany({ where: { teacherId: session.user.id, isActive: true }, include: { course: { select: { title: true, totalUnits: true } }, _count: { select: { enrollments: { where: { status: "active" } } } }, enrollments: { where: { status: "active" }, include: { progress: { where: { status: { in: ["passed","completed"] } }, select: { id: true } } } } } }),
    prisma.writingSubmission.findMany({ where: { status: "manual_review", attempt: { enrollment: { class: { teacherId: session.user.id } } } }, include: { attempt: { include: { enrollment: { include: { student: { select: { id: true, fullName: true } } } } } } }, orderBy: { createdAt: "desc" }, take: 5 }),
  ])
  const totalStudents = classes.reduce((s, c) => s + c._count.enrollments, 0)
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1><p className="text-sm text-gray-500">Welcome back, {session.user.name}</p></div>
      <div className="grid grid-cols-3 gap-4">
        {[{label:"Active Classes",value:classes.length,icon:BookOpen,c:"text-green-500 bg-green-50"},{label:"Total Students",value:totalStudents,icon:Users,c:"text-blue-500 bg-blue-50"},{label:"Pending Reviews",value:flagged.length,icon:AlertCircle,c:"text-orange-500 bg-orange-50"}].map(({label,value,icon:Icon,c})=>(
          <Card key={label}><CardContent className="p-4 flex items-center gap-3"><div className={`p-2 rounded-lg ${c.split(" ")[1]}`}><Icon className={`h-5 w-5 ${c.split(" ")[0]}`}/></div><div><div className="text-2xl font-bold text-gray-900">{value}</div><div className="text-xs text-gray-400">{label}</div></div></CardContent></Card>
        ))}
      </div>
      <div>
        <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-bold text-gray-900">My Classes</h2><Link href="/teacher/classes" className="text-sm text-green-600 hover:underline">Manage →</Link></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {classes.map((cls) => {
            const totalSteps = cls._count.enrollments * (cls.course.totalUnits * 10)
            const done = cls.enrollments.reduce((s, e) => s + e.progress.length, 0)
            const avg = totalSteps > 0 ? Math.round((done / totalSteps) * 100) : 0
            return (
              <Link key={cls.id} href={`/teacher/classes/${cls.id}`}>
                <Card className="hover:border-green-300 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2"><h3 className="font-semibold text-gray-900">{cls.name}</h3><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">{cls.classCode}</span></div>
                    <p className="text-xs text-gray-400 mb-3">{cls.course.title} · {cls._count.enrollments} students</p>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-400 rounded-full" style={{width:`${avg}%`}}/></div>
                    <p className="text-xs text-gray-400 mt-1">{avg}% avg completion</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
          <Link href="/teacher/classes/new"><Card className="border-dashed hover:border-green-400 transition-colors cursor-pointer h-full min-h-[100px]"><CardContent className="p-4 flex items-center justify-center h-full"><span className="text-sm text-gray-400 font-medium">+ Create New Class</span></CardContent></Card></Link>
        </div>
      </div>
      {flagged.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2"><AlertCircle className="h-5 w-5 text-orange-500"/>Writing Needs Review <span className="text-sm font-normal text-orange-600">({flagged.length})</span></h2>
          <div className="space-y-2">
            {flagged.map((sub) => (
              <Card key={sub.id} className="border-orange-100"><CardContent className="p-4 flex items-center justify-between">
                <div><p className="font-medium text-sm text-gray-900">{sub.attempt.enrollment.student.fullName}</p><p className="text-xs text-gray-400">AI Score: {sub.aiTotal??"-"}/10</p></div>
                <Link href={`/teacher/students/${sub.attempt.enrollment.student.id}`} className="text-sm text-orange-600 font-medium hover:underline">Review →</Link>
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
