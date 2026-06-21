import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen, Home, Users, LayoutList, BarChart3 } from "lucide-react"
const nav = [{href:"/teacher",label:"Dashboard",icon:Home},{href:"/teacher/students",label:"Students",icon:Users},{href:"/teacher/classes",label:"Classes",icon:LayoutList},{href:"/teacher/analytics",label:"Analytics",icon:BarChart3}]
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!["teacher","admin"].includes(session.user.role)) redirect("/dashboard")
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="hidden md:flex w-56 flex-col border-r bg-white shrink-0">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <BookOpen className="h-6 w-6 text-green-600"/>
          <div><span className="font-bold text-gray-900 text-sm block">ReadMaster</span><span className="text-[10px] text-green-600 font-medium">Teacher Portal</span></div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({href,label,icon:Icon})=>(
            <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors"><Icon className="h-4 w-4"/>{label}</Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">{session.user.name?.[0]?.toUpperCase()??"T"}</div>
            <div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-900 truncate">{session.user.name}</p><p className="text-[10px] text-green-600">Teacher</p></div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
