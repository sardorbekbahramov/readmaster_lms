"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { XpToastContainer } from "@/components/gamification/xp-toast"
import { useGamificationStore } from "@/stores/gamification.store"
import { cn } from "@/lib/utils"
import { ArrowLeft, PenLine, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
interface Props { unitId:string; unitTitle:string; unitNumber:number; writingTask:any; targetVocabulary:string[]; lessonId:string; enrollmentId:string; userId:string }
export function WritingClient({ unitId, unitTitle, unitNumber, writingTask, targetVocabulary, lessonId, enrollmentId, userId }: Props) {
  const router = useRouter()
  const { addToast, showLevelUp } = useGamificationStore()
  const [text, setText] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evalResult, setEvalResult] = useState<any>(null)
  const [showExample, setShowExample] = useState(false)
  const [attemptNumber, setAttemptNumber] = useState(1)
  const [serverError, setServerError] = useState<string|null>(null)
  const guideQuestions = Array.isArray(writingTask?.guideQuestions) ? writingTask.guideQuestions : []
  useEffect(()=>{ setWordCount(text.trim().split(/\s+/).filter(Boolean).length) },[text])
  const canSubmit = wordCount >= (writingTask?.minWords??60) && wordCount <= (writingTask?.maxWords??150) && !isSubmitting
  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true); setServerError(null)
    try {
      const attemptRes = await fetch("/api/progress/step-attempt",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enrollmentId,lessonId,stepTypeId:9})})
      const { attemptId } = await attemptRes.json()
      const res = await fetch("/api/ai/writing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enrollmentId,unitId,lessonId,stepAttemptId:attemptId,text,attemptNumber})})
      const data = await res.json()
      if (!res.ok){setServerError(data.error??"Submission failed");return}
      setEvalResult(data.evaluation)
      if (data.xpResult?.xpAwarded) addToast(data.xpResult.xpAwarded, data.evaluation.pass?"Writing Passed!":"Submitted")
      if (data.xpResult?.leveledUp) showLevelUp(data.xpResult.newLevel.level, data.xpResult.newLevel.title)
    } catch { setServerError("Something went wrong.") } finally { setIsSubmitting(false) }
  }
  const scoreColor = (s:number, m:number) => { const p=s/m; return p>=0.7?"text-green-600":p>=0.4?"text-yellow-600":"text-red-600" }
  return (
    <div className="min-h-screen bg-gray-50">
      <XpToastContainer/>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link href={`/dashboard/unit/${unitId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"><ArrowLeft className="h-4 w-4"/>Back to Unit</Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg"><PenLine className="h-5 w-5 text-green-600"/></div>
          <div>
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Step 9 — Writing</p>
            <h1 className="text-xl font-bold text-gray-900">Unit {unitNumber}: {unitTitle}</h1>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-gray-900 mb-3">📝 Topic</h2>
              <p className="text-sm text-gray-700 font-medium">{writingTask?.topic}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-semibold text-gray-900 mb-3">🧭 Guide Questions</h2>
              <ol className="space-y-2">{guideQuestions.map((q:string,i:number)=><li key={i} className="text-sm text-gray-600 flex gap-2"><span className="font-bold text-blue-600 shrink-0">{i+1}.</span>{q}</li>)}</ol>
            </div>
            {targetVocabulary.length>0&&<div className="bg-blue-50 rounded-xl border border-blue-100 p-4"><h2 className="font-semibold text-blue-800 mb-2 text-sm">💡 Target Vocabulary</h2><div className="flex flex-wrap gap-1.5">{targetVocabulary.map((w)=><span key={w} className="px-2 py-0.5 bg-white border border-blue-200 rounded-full text-xs text-blue-700 font-medium">{w}</span>)}</div></div>}
          </div>
          <div className="lg:col-span-3">
            {!evalResult?(
              <div className="bg-white rounded-xl border p-4 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Your paragraph</span>
                  <span className={cn("text-sm font-semibold",wordCount<(writingTask?.minWords??60)?"text-yellow-600":wordCount>(writingTask?.maxWords??150)?"text-red-500":"text-green-600")}>{wordCount} / {writingTask?.minWords??60}–{writingTask?.maxWords??150} words</span>
                </div>
                <textarea value={text} onChange={(e)=>setText(e.target.value)} className="flex-1 resize-none text-sm text-gray-800 leading-relaxed focus:outline-none min-h-[200px]" placeholder="Start writing here..."/>
                <div className="mt-3 border-t pt-3 space-y-2">
                  {serverError&&<p className="text-sm text-red-600">{serverError}</p>}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={cn("h-full rounded-full transition-all",wordCount>(writingTask?.maxWords??150)?"bg-red-400":wordCount<(writingTask?.minWords??60)?"bg-yellow-400":"bg-green-500")} style={{width:`${Math.min(100,(wordCount/(writingTask?.maxWords??150))*100)}%`}}/></div>
                  <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full h-10">
                    {isSubmitting?<><Loader2 className="h-4 w-4 animate-spin"/>AI reviewing…</>:"Submit for AI Review →"}
                  </Button>
                </div>
              </div>
            ):(
              <div className="space-y-4">
                <div className={cn("rounded-xl border-2 p-5",evalResult.pass?"border-green-300 bg-green-50":"border-orange-300 bg-orange-50")}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">{evalResult.pass?"✓ Writing Passed":"Keep Working"}</h3>
                    <span className={cn("text-3xl font-bold",evalResult.pass?"text-green-700":"text-orange-700")}>{evalResult.totalScore}/10</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[{l:"Content",s:evalResult.scoreContent,m:3},{l:"Structure",s:evalResult.scoreStructure,m:3},{l:"Grammar",s:evalResult.scoreGrammar,m:2},{l:"Vocabulary",s:evalResult.scoreVocab,m:2}].map(({l,s,m})=>(
                      <div key={l} className="bg-white rounded-lg p-2.5 border"><span className="text-xs text-gray-500">{l}</span><div className={cn("text-lg font-bold",scoreColor(s,m))}>{s}/{m}</div></div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-700">{evalResult.narrativeFeedback}</p>
                </div>
                {evalResult.suggestions?.length>0&&<div className="bg-white rounded-xl border p-4"><h3 className="font-semibold text-gray-900 mb-3 text-sm">💬 Suggestions</h3><ol className="space-y-2">{evalResult.suggestions.map((s:string,i:number)=><li key={i} className="text-sm text-gray-600 flex gap-2"><span className="font-bold text-blue-600 shrink-0">{i+1}.</span>{s}</li>)}</ol></div>}
                <div className="bg-white rounded-xl border p-4">
                  <button onClick={()=>setShowExample(!showExample)} className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold text-gray-700">View Example Paragraph</span>
                    {showExample?<ChevronUp className="h-4 w-4 text-gray-400"/>:<ChevronDown className="h-4 w-4 text-gray-400"/>}
                  </button>
                  {showExample&&<p className="mt-3 text-sm text-gray-600 leading-relaxed italic border-t pt-3">{writingTask?.exampleText}</p>}
                </div>
                {evalResult.pass?<Button className="w-full" onClick={()=>router.push(`/dashboard/unit/${unitId}/vocabulary-review`)}>Continue to Vocabulary Review →</Button>:<Button variant="outline" className="w-full" onClick={()=>{setEvalResult(null);setAttemptNumber(a=>a+1)}}>Revise and Resubmit</Button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
