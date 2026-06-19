"use client"
import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Settings, Bell, Eye, LogOut, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
type Tab = "account"|"privacy"|"notifications"
function Toggle({ checked, onChange }: { checked:boolean; onChange:(v:boolean)=>void }) {
  return <button onClick={()=>onChange(!checked)} className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",checked?"bg-blue-600":"bg-gray-200")}><span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",checked?"translate-x-6":"translate-x-1")}/></button>
}
function Row({ label, desc, checked, onChange }: { label:string; desc:string; checked:boolean; onChange:(v:boolean)=>void }) {
  return <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-gray-900">{label}</p><p className="text-xs text-gray-400 mt-0.5">{desc}</p></div><Toggle checked={checked} onChange={onChange}/></div>
}
export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("account")
  const [displayName, setDisplayName] = useState("")
  const [hide, setHide] = useState(false)
  const [ns, setNs] = useState(true); const [nb, setNb] = useState(true); const [nd, setNd] = useState(true); const [nw, setNw] = useState(true)
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false)
  const save = async () => { setSaving(true); await new Promise((r)=>setTimeout(r,700)); setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000) }
  const tabs = [{id:"account" as Tab,label:"Account",icon:Settings},{id:"privacy" as Tab,label:"Privacy",icon:Eye},{id:"notifications" as Tab,label:"Notifications",icon:Bell}]
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="flex flex-col sm:flex-row gap-6">
        <nav className="flex sm:flex-col gap-1 shrink-0 sm:w-44">
          {tabs.map(({id,label,icon:Icon})=>(
            <button key={id} onClick={()=>setTab(id)} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",tab===id?"bg-blue-50 text-blue-700":"text-gray-600 hover:bg-gray-100")}><Icon className="h-4 w-4"/>{label}</button>
          ))}
          <button onClick={()=>signOut()} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-4"><LogOut className="h-4 w-4"/>Sign Out</button>
        </nav>
        <div className="flex-1">
          {tab==="account"&&<div className="bg-white rounded-xl border p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Account Settings</h2>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label><input type="text" value={displayName} onChange={(e)=>setDisplayName(e.target.value)} placeholder="Your display name" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/><p className="text-xs text-gray-400 mt-1">Shown on the leaderboard</p></div>
            <Button onClick={save} disabled={saving} className="w-full">{saving?<><Loader2 className="h-4 w-4 animate-spin"/>Saving…</>:saved?"✓ Saved!":"Save Changes"}</Button>
          </div>}
          {tab==="privacy"&&<div className="bg-white rounded-xl border p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Privacy Settings</h2>
            <Row label="Hide from Leaderboard" desc="Your name won't appear on the class leaderboard" checked={hide} onChange={setHide}/>
            <p className="text-xs text-gray-400 pt-2 border-t">Your teacher can always see your progress regardless of privacy settings.</p>
            <Button onClick={save} disabled={saving} className="w-full">{saving?<><Loader2 className="h-4 w-4 animate-spin"/>Saving…</>:saved?"✓ Saved!":"Save Changes"}</Button>
          </div>}
          {tab==="notifications"&&<div className="bg-white rounded-xl border p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Notifications</h2>
            <Row label="Streak Reminders" desc="Alert when your streak is at risk (22:00)" checked={ns} onChange={setNs}/>
            <Row label="Badge Earned" desc="Notify when you earn a new badge" checked={nb} onChange={setNb}/>
            <Row label="Deadline Reminders" desc="24 hours before unit deadline" checked={nd} onChange={setNd}/>
            <Row label="Writing Reviewed" desc="Teacher reviewed your writing" checked={nw} onChange={setNw}/>
            <Button onClick={save} disabled={saving} className="w-full">{saving?<><Loader2 className="h-4 w-4 animate-spin"/>Saving…</>:saved?"✓ Saved!":"Save Changes"}</Button>
          </div>}
        </div>
      </div>
    </div>
  )
}
