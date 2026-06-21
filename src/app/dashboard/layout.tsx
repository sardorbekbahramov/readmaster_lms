import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen, Home, Trophy, Users, Settings } from "lucide-react"
const nav = [{href:"/dashboard",label:"Home",icon:Home},{href:"/dashboard/course",label:"Course",icon:BookOpen},{href:"/dashboard/leaderboard",label:"Leaderboard",icon:Users},{href:"/dashboard/achievements",label:"Badges",icon:Trophy},{href:"/dashboard/settings",label:"Settings",icon:Settings}]
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "student") redirect("/login")
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="hidden md:flex w-56 flex-col border-r bg-white shrink-0">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <BookOpen className="h-6 w-6 text-blue-600"/>
          <span className="font-bold text-gray-900 text-sm">ReadMaster</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({href,label,icon:Icon})=>(
            <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
              <Icon className="h-4 w-4"/>{label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">{session.user.name?.[0]?.toUpperCase()??"S"}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{session.user.name}</p>
              <p className="text-[10px] text-gray-400">Level {session.user.level}</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t flex z-40">
        {nav.slice(0,4).map(({href,label,icon:Icon})=>(
          <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-blue-600 transition-colors">
            <Icon className="h-5 w-5"/><span className="text-[10px]">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
