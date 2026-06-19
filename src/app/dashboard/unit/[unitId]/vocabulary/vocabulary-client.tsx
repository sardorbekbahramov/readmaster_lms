"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { XpToastContainer } from "@/components/gamification/xp-toast"
import { useGamificationStore } from "@/stores/gamification.store"
import { cn } from "@/lib/utils"
import { ArrowLeft, BookOpen, CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
interface VocabItem { id:string; word:string; definition:string; sortOrder:number }
interface Props { unitId:string; unitTitle:string; unitNumber:number; vocabulary:VocabItem[]; enrollmentId:string; userId:string; stepTypeId?:number; nextPath?:string }
export function VocabularyClient({ unitId, unitTitle, unitNumber, vocabulary, enrollmentId, userId, stepTypeId=2, nextPath="reading" }: Props) {
  const router = useRouter()
  const { addToast, showLevelUp } = useGamificationStore()
  const [phase, setPhase] = useState<"flashcards"|"matching"|"results">("flashcards")
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [selected, setSelected] = useState<Record<string,string>>({})
  const [results, setResults] = useState<Record<string,boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)
  const shuffled = [...vocabulary].sort(() => Math.random() - 0.5)
  const handleSubmitMatching = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const newResults: Record<string,boolean> = {}
    let correct = 0
    for (const vocab of vocabulary) {
      const isCorrect = selected[vocab.id] === vocab.id
      newResults[vocab.id] = isCorrect
      if (isCorrect) correct++
    }
    const scoreVal = Math.round((correct / vocabulary.length) * 100)
    const passedVal = scoreVal >= 70
    setResults(newResults); setScore(scoreVal); setPassed(passedVal); setPhase("results")
    try {
      const res = await fetch("/api/progress/step",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enrollmentId,unitId,stepTypeId,score:scoreVal,passed:passedVal})})
      const data = await res.json()
      if (data.xpResult?.xpAwarded) addToast(data.xpResult.xpAwarded, passedVal?"Vocabulary Passed!":"Completed")
      if (data.xpResult?.leveledUp) showLevelUp(data.xpResult.newLevel.level, data.xpResult.newLevel.title)
    } catch {} finally { setIsSubmitting(false) }
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <XpToastContainer/>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href={`/dashboard/unit/${unitId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"><ArrowLeft className="h-4 w-4"/>Back to Unit</Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg"><BookOpen className="h-5 w-5 text-blue-600"/></div>
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Step {stepTypeId===2?"2":"10"} — Vocabulary {stepTypeId===2?"Preview":"Review"}</p>
            <h1 className="text-xl font-bold text-gray-900">Unit {unitNumber}: {unitTitle}</h1>
          </div>
        </div>
        {phase !== "results" && (
          <div className="flex gap-2 mb-6">
            {(["flashcards","matching"] as const).map((p)=>(
              <button key={p} onClick={()=>{setPhase(p);setFlipped(false)}} className={cn("px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors",phase===p?"bg-blue-600 text-white":"bg-white text-gray-600 border hover:bg-gray-50")}>{p}</button>
            ))}
          </div>
        )}
        {phase === "flashcards" && vocabulary.length > 0 && (
          <div>
            <div className="text-center mb-4 text-sm text-gray-500">{currentCard+1} / {vocabulary.length}</div>
            <div onClick={()=>setFlipped(!flipped)} className={cn("relative h-48 rounded-2xl border-2 cursor-pointer flex items-center justify-center transition-all duration-300",flipped?"bg-blue-600 border-blue-600 text-white":"bg-white border-gray-200 text-gray-900")}>
              <div className="text-center px-6">
                <p className="text-2xl font-bold mb-2">{flipped?vocabulary[currentCard].definition:vocabulary[currentCard].word}</p>
                <p className="text-sm opacity-70">{flipped?"definition":"click to reveal"}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={()=>{setCurrentCard(Math.max(0,currentCard-1));setFlipped(false)}} disabled={currentCard===0}>← Previous</Button>
              {currentCard<vocabulary.length-1?<Button className="flex-1" onClick={()=>{setCurrentCard(currentCard+1);setFlipped(false)}}>Next →</Button>:<Button className="flex-1" onClick={()=>setPhase("matching")}>Start Matching →</Button>}
            </div>
          </div>
        )}
        {phase === "matching" && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Match each word to its definition:</p>
            <div className="space-y-2 mb-6">
              {vocabulary.map((vocab)=>(
                <div key={vocab.id} className="flex gap-2 items-center">
                  <div className="flex-1 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-semibold text-blue-800">{vocab.word}</div>
                  <select value={selected[vocab.id]??""} onChange={(e)=>setSelected((prev)=>({...prev,[vocab.id]:e.target.value}))} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                    <option value="">Select definition…</option>
                    {shuffled.map((opt)=><option key={opt.id} value={opt.id}>{opt.definition}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <Button onClick={handleSubmitMatching} disabled={Object.keys(selected).length<vocabulary.length||isSubmitting} className="w-full h-11">
              {isSubmitting?<><Loader2 className="h-4 w-4 animate-spin"/>Submitting…</>:"Submit Answers"}
            </Button>
          </div>
        )}
        {phase === "results" && (
          <div className="text-center">
            <div className={cn("mx-auto mb-4 h-20 w-20 rounded-full flex items-center justify-center text-3xl font-bold",passed?"bg-green-100 text-green-700":"bg-orange-100 text-orange-700")}>{score}%</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{passed?"Vocabulary Passed! ✓":"Keep Practicing"}</h2>
            <p className="text-gray-500 text-sm mb-6">{passed?"Moving to the next step.":"Score 70% or more to continue."}</p>
            <div className="space-y-2 mb-6 text-left">
              {vocabulary.map((vocab)=>(
                <div key={vocab.id} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-lg border",results[vocab.id]?"bg-green-50 border-green-200":"bg-red-50 border-red-200")}>
                  {results[vocab.id]?<CheckCircle className="h-4 w-4 text-green-500 shrink-0"/>:<XCircle className="h-4 w-4 text-red-500 shrink-0"/>}
                  <span className="font-medium text-sm">{vocab.word}</span>
                  <span className="text-sm text-gray-500">— {vocab.definition}</span>
                </div>
              ))}
            </div>
            {passed?<Button className="w-full" onClick={()=>router.push(`/dashboard/unit/${unitId}/${nextPath}`)}>Continue →</Button>
            :<Button variant="outline" className="w-full" onClick={()=>{setPhase("flashcards");setSelected({});setCurrentCard(0);setFlipped(false)}}>Try Again</Button>}
          </div>
        )}
      </div>
    </div>
  )
}
