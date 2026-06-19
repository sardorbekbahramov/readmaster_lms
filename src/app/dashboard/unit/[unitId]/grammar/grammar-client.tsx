"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { XpToastContainer } from "@/components/gamification/xp-toast"
import { useGamificationStore } from "@/stores/gamification.store"
import { cn } from "@/lib/utils"
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import Link from "next/link"
interface Option { id:string; optionKey:string; optionText:string; isCorrect:boolean }
interface Question { id:string; questionText:string; explanation:string|null; options:Option[] }
interface Props { unitId:string; unitTitle:string; unitNumber:number; grammarTopic:any; questions:Question[]; enrollmentId:string; userId:string }
export function GrammarClient({ unitId, unitTitle, unitNumber, grammarTopic, questions, enrollmentId, userId }: Props) {
  const router = useRouter()
  const { addToast, showLevelUp } = useGamificationStore()
  const [showRule, setShowRule] = useState(true)
  const [answers, setAnswers] = useState<Record<string,string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<Record<string,boolean>>({})
  const [aiExpls, setAiExpls] = useState<Record<string,string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)
  const examples = Array.isArray(grammarTopic?.examples) ? grammarTopic.examples : []
  const handleSubmit = async () => {
    if (isSubmitting || Object.keys(answers).length < questions.length) return
    setIsSubmitting(true)
    const newResults: Record<string,boolean> = {}
    let correct = 0
    for (const q of questions) {
      const isCorrect = answers[q.id] === q.options.find((o) => o.isCorrect)?.optionKey
      newResults[q.id] = isCorrect
      if (isCorrect) correct++
    }
    const scoreVal = Math.round((correct / questions.length) * 100)
    const passedVal = scoreVal >= 70
    setResults(newResults); setScore(scoreVal); setPassed(passedVal); setSubmitted(true)
    const wrong = questions.filter((q) => !newResults[q.id])
    for (const q of wrong) {
      if (q.explanation) { setAiExpls((prev) => ({...prev,[q.id]:q.explanation!})); continue }
      try {
        const res = await fetch("/api/ai/grammar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({grammarTopicName:grammarTopic?.topicName??"",ruleExplanation:grammarTopic?.explanation??"",questionText:q.questionText,correctAnswer:q.options.find((o)=>o.isCorrect)?.optionText??"",studentAnswer:q.options.find((o)=>o.optionKey===answers[q.id])?.optionText??"",userId})})
        const data = await res.json()
        if (data.correctionExplanation) setAiExpls((prev) => ({...prev,[q.id]:data.correctionExplanation}))
      } catch {}
    }
    try {
      const res = await fetch("/api/progress/step",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enrollmentId,unitId,stepTypeId:6,score:scoreVal,passed:passedVal,answers:questions.map((q)=>({questionId:q.id,answer:answers[q.id]??"",isCorrect:newResults[q.id]??false}))})})
      const data = await res.json()
      if (data.xpResult?.xpAwarded) addToast(data.xpResult.xpAwarded, passedVal?"Grammar Passed!":"Completed")
      if (data.xpResult?.leveledUp) showLevelUp(data.xpResult.newLevel.level, data.xpResult.newLevel.title)
    } catch {} finally { setIsSubmitting(false) }
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <XpToastContainer/>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href={`/dashboard/unit/${unitId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"><ArrowLeft className="h-4 w-4"/>Back to Unit</Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg"><BookOpen className="h-5 w-5 text-purple-600"/></div>
          <div>
            <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Step 6 — Grammar</p>
            <h1 className="text-xl font-bold text-gray-900">Unit {unitNumber}: {unitTitle}</h1>
          </div>
        </div>
        {grammarTopic && (
          <div className="bg-white rounded-xl border p-4 mb-5">
            <button onClick={()=>setShowRule(!showRule)} className="flex items-center justify-between w-full">
              <span className="font-semibold text-gray-900">{grammarTopic.topicName}</span>
              {showRule?<ChevronUp className="h-4 w-4 text-gray-400"/>:<ChevronDown className="h-4 w-4 text-gray-400"/>}
            </button>
            {showRule && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{grammarTopic.explanation}</p>
                {examples.map((ex: any, i: number) => (
                  <div key={i} className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-sm text-gray-600 mb-1">{ex.sentence}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {!submitted ? (
          <div className="space-y-4 mb-6">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-xl border p-4">
                <p className="font-medium text-gray-900 mb-3"><span className="text-gray-400 mr-2">{idx+1}.</span>{q.questionText}</p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <button key={opt.id} onClick={()=>setAnswers((prev)=>({...prev,[q.id]:opt.optionKey}))} className={cn("px-4 py-2 rounded-lg border text-sm font-medium transition-all",answers[q.id]===opt.optionKey?"border-purple-500 bg-purple-50 text-purple-800":"border-gray-200 bg-white hover:border-gray-300")}>{opt.optionText}</button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={handleSubmit} disabled={Object.keys(answers).length<questions.length||isSubmitting} className="w-full h-11">
              {isSubmitting?<><Loader2 className="h-4 w-4 animate-spin"/>Checking...</>:"Check Answers"}
            </Button>
          </div>
        ) : (
          <div>
            <div className="space-y-4 mb-6">
              {questions.map((q) => (
                <div key={q.id} className={cn("bg-white rounded-xl border p-4",results[q.id]?"border-green-200":"border-red-200")}>
                  <p className="font-medium text-gray-900 mb-3">{q.questionText}</p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => (
                      <span key={opt.id} className={cn("px-4 py-2 rounded-lg border text-sm font-medium",opt.isCorrect?"border-green-400 bg-green-50 text-green-800":answers[q.id]===opt.optionKey&&!opt.isCorrect?"border-red-400 bg-red-50 text-red-800":"border-gray-100 bg-gray-50 text-gray-400")}>{opt.optionText}</span>
                    ))}
                  </div>
                  {!results[q.id] && aiExpls[q.id] && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">💡 {aiExpls[q.id]}</div>
                  )}
                </div>
              ))}
            </div>
            <div className={cn("text-center p-4 rounded-xl border-2 mb-4",passed?"border-green-300 bg-green-50 text-green-800":"border-orange-300 bg-orange-50 text-orange-800")}>
              <p className="text-2xl font-bold">{score}%</p>
              <p className="text-sm">{passed?"Grammar Passed! ✓":"Need 70% to pass"}</p>
            </div>
            {passed?<Button className="w-full" onClick={()=>router.push(`/dashboard/unit/${unitId}/listening`)}>Continue to Listening →</Button>
            :<Button variant="outline" className="w-full" onClick={()=>{setSubmitted(false);setAnswers({});setResults({})}}>Try Again</Button>}
          </div>
        )}
      </div>
    </div>
  )
}
