"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
export default function NewClassPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [unlockMode, setUnlockMode] = useState("sequential")
  const [maxStudents, setMaxStudents] = useState(30)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const handleCreate = async () => {
    if (!name.trim()){setError("Class name is required");return}
    setIsCreating(true); setError(null)
    try {
      const coursesRes = await fetch("/api/classes")
      const existing = await coursesRes.json()
      const courseId = existing[0]?.courseId ?? ""
      const res = await fetch("/api/classes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name.trim(),courseId,unlockMode,maxStudents})})
      if (!res.ok){const d=await res.json();setError(d.error??"Failed to create class");return}
      router.push("/teacher/classes"); router.refresh()
    } catch { setError("Something went wrong.") } finally { setIsCreating(false) }
  }
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Link href="/teacher/classes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"><ArrowLeft className="h-4 w-4"/>Back to Classes</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Class</h1>
      {error&&<div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label><input value={name} onChange={(e)=>setName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Morning Class — RC1"/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Unlock Mode</label>
          <select value={unlockMode} onChange={(e)=>setUnlockMode(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="sequential">Sequential — unlock one by one</option>
            <option value="open">Open — all units available</option>
            <option value="manual">Manual — teacher controls unlock</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label><input type="number" value={maxStudents} min={1} max={100} onChange={(e)=>setMaxStudents(Number(e.target.value))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/></div>
        <Button onClick={handleCreate} disabled={isCreating} className="w-full bg-green-600 hover:bg-green-700">{isCreating?<><Loader2 className="h-4 w-4 animate-spin"/>Creating...</>:"Create Class"}</Button>
      </div>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
        <p className="font-medium mb-1">After creating:</p>
        <ul className="list-disc list-inside space-y-0.5 text-xs"><li>A unique class code will be generated</li><li>Share the code with students to enroll</li><li>Unlock units from the class management page</li></ul>
      </div>
    </div>
  )
}
