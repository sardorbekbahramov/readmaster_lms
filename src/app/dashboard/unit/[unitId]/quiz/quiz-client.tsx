"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { XpToastContainer } from "@/components/gamification/xp-toast"
import { useGamificationStore } from "@/stores/gamification.store"
import { cn } from "@/lib/utils"
import { ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
interface Option { id:string; optionKey:string; optionText:string; isCorrect:boolean }
interface Question { id:string; questionText:string; explanation:string|null; options:Option[] }
interface Props { unitId:string; unitTitle:string; unitNumber:number; questions:Question[]; stepTypeId:number; stepLabel:string; stepNumber:number; nextPath:string; enrollmentId:string; userId:string; passThreshold:number }
export function QuizClient({ unitId, unitTitle, unitNumber, questions, stepTypeId, stepLabel, stepNumber, nextPath, enrollmentId, userId, passThreshold }: Props) {
  const router = useRouter()
  const { addToast, showLevelUp } = useGamificationStore()
  const [phase, setPhase] = useState<"quiz"|"results">("quiz")
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<string|null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<{questionId:string;answer:string;isCorrect:boolean}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)
  const question = questions[currentQ]
  const isLast = currentQ === questions.length - 1
  const handleSubmitAnswer = () => {
    if (!selected || submitted) return
    const correct = question.options.find((o) => o.isCorrect)
    const isCorrect = selected === correct?.optionKey
    setSubmitted(true)
    setAnswers((prev) => [...prev, { questionId: question.id, answer: selected, isCorrect }])
  }
  const handleNext = async () => {
    if (isLast) {
      setIsSubmitting(true)
      const all = [...answers]
      const correct = all.filter((a) => a.isCorrect).length
      const scoreVal = Math.round((correct / questions.length) * 100)
      const passedVal = scoreVal >= passThreshold
      setScore(scoreVal); setPassed(passedVal); setPhase("results")
      try {
        const res = await fetch("/api/progress/step",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enrollmentId,unitId,stepTypeId,score:scoreVal,passed:passedVal,answers:all})})
        const data = await res.json()
        if (data.xpResult?.xpAwarded) addToast(data.xpResult.xpAwarded, passedVal?"Quiz Passed!":"Completed")
        if (data.xpResult?.leveledUp) showLevelUp(data.xpResult.newLevel.level, data.xpResult.newLevel.title)
      } catch {} finally { setIsSubmitting(false) }
    } else {
      setCurrentQ(currentQ+1); setSelected(null); setSubmitted(false)
    }
  }
  if (!question && phase === "quiz") return null
  return (
    <div className="min-h-screen bg-gray-50">
      <XpToastContainer/>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href={`/dashboard/unit/${unitId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"><ArrowLeft className="h-4 w-4"/>Back to Unit</Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg"><span className="text-purple-600 font-bold text-sm">{stepNumber}</span></div>
          <div>
            <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Step {stepNumber} — {stepLabel}</p>
            <h1 className="text-xl font-bold text-gray-900">Unit {unitNumber}: {unitTitle}</h1>
          </div>
        </div>
        {phase === "quiz" && question && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Question {currentQ+1} of {questions.length}</span>
              <div className="flex gap-1.5">
                {questions.map((_,i)=><div key={i} className={cn("h-2 w-6 rounded-full",i<currentQ?(answers[i]?.isCorrect?"bg-green-400":"bg-red-400"):i===currentQ?"bg-blue-400":"bg-gray-200")}/>)}
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-6 mb-4 shadow-sm">
              <p className="text-lg font-semibold text-gray-900 leading-relaxed">{question.questionText}</p>
            </div>
            <div className="space-y-2 mb-4">
              {question.options.map((opt)=>{
                const isSel=selected===opt.optionKey; const showRes=submitted
                return (
                  <button key={opt.id} onClick={()=>!submitted&&setSelected(opt.optionKey)} disabled={submitted}
                    className={cn("w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all",
                      !submitted&&isSel?"border-blue-500 bg-blue-50 text-blue-800":!submitted?"border-gray-200 bg-white hover:border-gray-300":
                      showRes&&opt.isCorrect?"border-green-400 bg-green-50 text-green-800":
                      showRes&&isSel&&!opt.isCorrect?"border-red-400 bg-red-50 text-red-800":"border-gray-100 bg-gray-50 text-gray-400"
                    )}>
                    <span className="font-bold uppercase mr-2.5">{opt.optionKey}.</span>{opt.optionText}
                    {showRes&&opt.isCorrect&&<CheckCircle className="inline ml-2 h-4 w-4 text-green-500"/>}
                    {showRes&&isSel&&!opt.isCorrect&&<XCircle className="inline ml-2 h-4 w-4 text-red-500"/>}
                  </button>
                )
              })}
            </div>
            {submitted&&!isLast&&question.explanation&&<div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200"><p className="text-xs font-semibold text-amber-700 mb-1">💡 Explanation</p><p className="text-sm text-amber-800">{question.explanation}</p></div>}
            {!submitted?<Button onClick={handleSubmitAnswer} disabled={!selected} className="w-full h-11">Submit Answer</Button>
            :<Button onClick={handleNext} disabled={isSubmitting} className="w-full h-11">{isSubmitting?<Loader2 className="h-4 w-4 animate-spin"/>:isLast?"See Results →":"Next Question →"}</Button>}
          </div>
        )}
        {phase === "results" && (
          <div className="text-center">
            <div className={cn("mx-auto mb-4 h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold",passed?"bg-green-100 text-green-700":"bg-orange-100 text-orange-700")}>{score}%</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{passed?"Quiz Passed! ✓":"Keep Practicing"}</h2>
            <p className="text-sm text-gray-500 mb-6">{passed?"Moving to the next step.":`Need ${passThreshold}% to pass. Try again!`}</p>
            <div className="space-y-2 mb-6 text-left">
              {questions.map((q,i)=>(<div key={q.id} className={cn("flex items-start gap-3 p-3 rounded-lg border text-sm",answers[i]?.isCorrect?"bg-green-50 border-green-200":"bg-red-50 border-red-200")}>{answers[i]?.isCorrect?<CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/>:<XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0"/>}<span className="text-gray-700">{q.questionText}</span></div>))}
            </div>
            {passed?<Button className="w-full" onClick={()=>router.push(`/dashboard/unit/${unitId}/${nextPath}`)}>Continue →</Button>
            :<Button variant="outline" className="w-full" onClick={()=>{setPhase("quiz");setCurrentQ(0);setSelected(null);setSubmitted(false);setAnswers([])}}>Try Again</Button>}
          </div>
        )}
      </div>
    </div>
  )
}
