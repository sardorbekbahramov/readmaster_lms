"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useReadingStore } from "@/stores/reading.store"
import { useGamificationStore } from "@/stores/gamification.store"
import { Loader2, Volume2, CheckCircle, XCircle } from "lucide-react"
interface Option { id:string; optionKey:string; optionText:string; isCorrect:boolean }
interface Question { id:string; questionText:string; options:Option[] }
interface Props {
  paragraphId:string; paraIndex:number; content:string; question:Question|undefined
  enrollmentId:string; unitId:string; audioUrl?:string|null; isPrevious?:boolean
}
export function ParagraphCard({ paragraphId, paraIndex, content, question, enrollmentId, unitId, audioUrl, isPrevious }: Props) {
  const paraState = useReadingStore((s) => s.paragraphs[paragraphId])
  const { showQuestion, setAnswer, setAiExplanation, completeParagraph, incrementAttempt, addSessionXP, setConfidence } = useReadingStore()
  const { addToast, showLevelUp } = useGamificationStore()
  const [askMeReady, setAskMeReady] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(15)
  const [selectedOption, setSelectedOption] = useState<string|null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingAI, setIsFetchingAI] = useState(false)
  const [showSpeedWarning, setShowSpeedWarning] = useState(false)
  const readingStartedAt = useRef(Date.now())

  useEffect(() => {
    if (paraState?.status!=="reading") return
    readingStartedAt.current = Date.now()
    setAskMeReady(false); setSecondsLeft(15)
    const interval = setInterval(() => {
      setSecondsLeft((prev) => { if (prev<=1){clearInterval(interval);setAskMeReady(true);return 0} return prev-1 })
    },1000)
    return () => clearInterval(interval)
  }, [paraState?.status])

  const handleAskMe = () => {
    if (!askMeReady) return
    const t = Math.floor((Date.now()-readingStartedAt.current)/1000)
    if (t<20) { setShowSpeedWarning(true); return }
    showQuestion(paragraphId)
  }

  const handleSubmit = async () => {
    if (!selectedOption||!question||isSubmitting) return
    setIsSubmitting(true)
    const attemptNumber = paraState?.attemptNumber??1
    try {
      const res = await fetch("/api/progress/paragraph",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paragraphId,enrollmentId,unitId,paragraphIndex:paraIndex,answer:selectedOption,attemptNumber,readingStartedAt:readingStartedAt.current,readingDurationSec:Math.floor((Date.now()-readingStartedAt.current)/1000),confidenceRating:paraState?.confidenceRating})})
      const data = await res.json()
      const isCorrect = data.isCorrect as boolean
      const xp = data.xpResult?.xpAwarded??0
      const ct = isCorrect?(attemptNumber===1?"strong":"reviewed"):"ai_assisted"
      setAnswer(paragraphId,isCorrect,xp,isCorrect||attemptNumber>=2?ct:null)
      if (!isCorrect&&attemptNumber<2) {
        setIsFetchingAI(true)
        try {
          const ai = await fetch("/api/ai/reading",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paragraphId,questionId:question.id,studentAnswer:selectedOption,attemptNumber})})
          const aiData = await ai.json()
          setAiExplanation(paragraphId,aiData.explanation,aiData.passageRef,aiData.distractor)
        } finally { setIsFetchingAI(false) }
        incrementAttempt(paragraphId); setSelectedOption(null)
      } else {
        if (xp>0){addToast(xp,isCorrect?"Correct!":"Completed");addSessionXP(xp)}
        if (data.xpResult?.leveledUp) showLevelUp(data.xpResult.newLevel.level,data.xpResult.newLevel.title)
        setTimeout(()=>completeParagraph(paragraphId),600)
      }
    } catch(e){console.error(e)} finally{setIsSubmitting(false)}
  }

  if (!paraState) return null
  return (
    <div className={cn("transition-all duration-500",isPrevious?"opacity-50":"opacity-100")}>
      <div className={cn("rounded-xl border p-6 mb-4 bg-white shadow-sm reading-text",["reading","questioning","answered"].includes(paraState.status)&&"ring-2 ring-blue-200")}>
        {audioUrl&&<button className="mb-3 flex items-center gap-2 text-sm text-blue-600"><Volume2 className="h-4 w-4"/>Play audio</button>}
        <p className="text-gray-800">{content}</p>
        {paraState.status==="complete"&&(
          <div className={cn("mt-3 flex items-center gap-2 text-sm font-medium",paraState.completionType==="strong"?"text-green-600":paraState.completionType==="reviewed"?"text-blue-600":"text-orange-600")}>
            <CheckCircle className="h-4 w-4"/>
            {paraState.completionType==="strong"?"Understood on first attempt":paraState.completionType==="reviewed"?"Understood on second attempt":"Completed with AI support"}
            {paraState.xpEarned>0&&<span className="ml-1 text-yellow-600">+{paraState.xpEarned} XP</span>}
          </div>
        )}
      </div>

      {paraState.status==="reading"&&askMeReady&&!paraState.confidenceRating&&(
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-2">How well did you understand?</p>
          <div className="flex gap-2">
            {[{key:"clear",label:"Got it ✓",c:"border-green-300 bg-green-50 text-green-700"},{key:"think_so",label:"Think so 🤔",c:"border-yellow-300 bg-yellow-50 text-yellow-700"},{key:"unsure",label:"Not sure 😅",c:"border-red-300 bg-red-50 text-red-700"}].map(({key,label,c})=>(
              <button key={key} onClick={()=>setConfidence(paragraphId,key as any)} className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${c}`}>{label}</button>
            ))}
          </div>
        </div>
      )}

      {showSpeedWarning&&(
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">⚡ You read this very quickly. Consider re-reading first.</p>
          <div className="flex gap-3 mt-2">
            <button onClick={()=>setShowSpeedWarning(false)} className="text-xs text-amber-600 hover:underline">Re-read</button>
            <button onClick={()=>{setShowSpeedWarning(false);showQuestion(paragraphId)}} className="text-xs text-amber-800 font-medium hover:underline">Continue anyway →</button>
          </div>
        </div>
      )}

      {paraState.status==="reading"&&(
        <div className="mb-4">
          <Button onClick={handleAskMe} disabled={!askMeReady} className="w-full sm:w-auto">
            {askMeReady?"Ask Me a Question →":`Ask Me (${secondsLeft}s)`}
          </Button>
        </div>
      )}

      {(paraState.status==="questioning"||paraState.status==="answered")&&question&&(
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 mb-4 animate-in">
          <p className="font-semibold text-gray-800 mb-4">{question.questionText}</p>
          {paraState.aiExplanation&&(
            <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm">
              <p className="font-medium text-amber-800 mb-1">💡 Explanation</p>
              <p className="text-amber-700">{paraState.aiExplanation}</p>
              {paraState.aiPassageRef&&<p className="mt-1 text-amber-600 italic text-xs">{paraState.aiPassageRef}</p>}
            </div>
          )}
          <div className="flex flex-col gap-2">
            {question.options.map((opt)=>{
              const isSel=selectedOption===opt.optionKey
              const showRes=paraState.status==="answered"
              return(
                <button key={opt.id} onClick={()=>!showRes&&setSelectedOption(opt.optionKey)} disabled={showRes||isSubmitting}
                  className={cn("w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all",
                    !showRes&&isSel?"border-blue-500 bg-blue-100":!showRes?"border-gray-200 bg-white hover:border-gray-300":
                    showRes&&opt.isCorrect?"border-green-500 bg-green-50 text-green-800":
                    showRes&&isSel&&!opt.isCorrect?"border-red-400 bg-red-50 text-red-800":"border-gray-100 bg-gray-50 text-gray-400"
                  )}>
                  <span className="font-bold mr-2 uppercase">{opt.optionKey}.</span>{opt.optionText}
                  {showRes&&opt.isCorrect&&<CheckCircle className="inline ml-2 h-4 w-4 text-green-600"/>}
                  {showRes&&isSel&&!opt.isCorrect&&<XCircle className="inline ml-2 h-4 w-4 text-red-500"/>}
                </button>
              )
            })}
          </div>
          {paraState.status==="questioning"&&(
            <Button onClick={handleSubmit} disabled={!selectedOption||isSubmitting||isFetchingAI} className="mt-4 w-full">
              {isSubmitting||isFetchingAI?<><Loader2 className="h-4 w-4 animate-spin"/>Checking...</>:"Submit Answer"}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
