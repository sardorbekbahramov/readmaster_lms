import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
export default async function AdminSettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3 mb-6"><Settings className="h-6 w-6 text-purple-600"/><h1 className="text-2xl font-bold text-gray-900">System Settings</h1></div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Platform</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[{l:"App Name",v:"ReadMaster LMS"},{l:"Version",v:"1.0.0"},{l:"Environment",v:process.env.NODE_ENV??"development"},{l:"Database",v:"PostgreSQL (Neon)"},{l:"AI Model",v:"Groq llama-3.3-70b-versatile"}].map(({l,v})=>(
            <div key={l} className="flex items-center justify-between py-2 border-b last:border-0"><span className="text-sm text-gray-500">{l}</span><span className="text-sm font-medium text-gray-900">{v}</span></div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Cron Jobs</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[{l:"Weekly Insights",s:"Sunday 20:00 UTC"},{l:"Streak Check",s:"Daily 01:00 UTC"},{l:"Leaderboard Snapshot",s:"Monday 00:00 UTC"}].map(({l,s})=>(
            <div key={l} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
              <div><p className="text-sm font-medium text-gray-900">{l}</p><p className="text-xs text-gray-400">{s}</p></div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">active</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
