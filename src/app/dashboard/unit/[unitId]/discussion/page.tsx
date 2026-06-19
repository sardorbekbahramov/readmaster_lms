"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { XpToastContainer } from "@/components/gamification/xp-toast"
import { useGamificationStore } from "@/stores/gamification.store"
import { ArrowLeft, MessageSquare, Loader2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
const PROMPTS = [
  "What did you find most interesting about this passage?",
  "How does the topic relate to your own life or experiences?",
  "Would you like to experience what was described? Why or why not?",
]
export default function DiscussionPage() {
  const params = useParams()
  const unitId = params.unitId as string
  const router = useRouter()
  const { addToast } = useGamificationStore()
  const [responses, setResponses] = useState(["","",""])
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const wordCount = responses.join(" ").trim().split(/\s+/).filter(Boolean).length
  const canSubmit = wordCount >= 20 && !isSubmitting
  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/progress/step",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enrollmentId:"",unitId,stepTypeId:8,score:100,passed:true})})
      const data = await res.json()
      if (data.xpResult?.xpAwarded) addToast(data.xpResult.xpAwarded,"Discussion Complete!")
      setSubmitted(true)
    } catch {} finally { setIsSubmitting(false) }
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <XpToastContainer/>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href={`/dashboard/unit/${unitId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"><ArrowLeft className="h-4 w-4"/>Back to Unit</Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-teal-100 rounded-lg"><MessageSquare className="h-5 w-5 text-teal-600"/></div>
          <div>
            <p className="text-xs font-medium text-teal-600 uppercase tracking-wide">Step 8 — Discussion</p>
            <p className="text-sm text-gray-500">Share your thoughts — no right or wrong answers</p>
          </div>
        </div>
        {!submitted?(
          <div className="space-y-4">
            {PROMPTS.map((prompt,i)=>(
              <div key={i} className="bg-white rounded-xl border p-4">
                <p className="text-sm font-semibold text-gray-800 mb-2">{i+1}. {prompt}</p>
                <textarea value={responses[i]} onChange={(e)=>{const u=[...responses];u[i]=e.target.value;setResponses(u)}} rows={3} placeholder="Write your thoughts here..." className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"/>
              </div>
            ))}
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>Total words: {wordCount}</span><span>Minimum: 20 words</span>
            </div>
            <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full h-11 bg-teal-600 hover:bg-teal-700">
              {isSubmitting?<><Loader2 className="h-4 w-4 animate-spin"/>Submitting...</>:"Submit Discussion →"}
            </Button>
          </div>
        ):(
          <div className="text-center bg-white rounded-2xl border p-8">
            <div className="text-4xl mb-3">💬</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Discussion Submitted!</h2>
            <p className="text-sm text-gray-500 mb-6">Great thinking. Now write your paragraph.</p>
            <Button className="w-full" onClick={()=>router.push(`/dashboard/unit/${unitId}/writing`)}>Continue to Writing →</Button>
          </div>
        )}
      </div>
    </div>
  )
}
