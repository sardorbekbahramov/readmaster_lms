"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useReadingStore } from "@/stores/reading.store"
import { ParagraphCard } from "@/components/reading/paragraph-card"
import { ReadingProgressStrip } from "@/components/reading/reading-progress-strip"
import { XpToastContainer } from "@/components/gamification/xp-toast"
import { LevelUpModal } from "@/components/gamification/level-up-modal"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle } from "lucide-react"
export function ReadingPageClient({ unit, enrollmentId, userId, existingAttempts }: any) {
  const router = useRouter()
  const { initSession, paragraphs, allComplete, sessionXP, currentParaIndex } = useReadingStore()
  const paragraphIds = unit.paragraphs.map((p: any) => p.id)
  const questions = unit.lessons[0]?.questions ?? []
  useEffect(() => {
    const alreadyInit = paragraphIds.every((id: string) => Object.keys(paragraphs).includes(id))
    if (!alreadyInit) initSession(unit.id, paragraphIds)
  }, [unit.id])
  return (
    <div className="min-h-screen bg-gray-50">
      <XpToastContainer/><LevelUpModal/>
      <ReadingProgressStrip paragraphIds={paragraphIds} unitTitle={unit.title}/>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg"><BookOpen className="h-5 w-5 text-blue-600"/></div>
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Step 3 — Reading Passage</p>
            <h1 className="text-xl font-bold text-gray-900">Unit {unit.unitNumber}: {unit.title}</h1>
          </div>
        </div>
        {unit.paragraphs.map((para: any, index: number) => (
          <ParagraphCard key={para.id} paragraphId={para.id} paraIndex={index} content={para.content} question={questions[index]} enrollmentId={enrollmentId} unitId={unit.id} audioUrl={para.audioUrl} isPrevious={index < currentParaIndex && paragraphs[para.id]?.status === "complete"}/>
        ))}
        {allComplete && (
          <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-7 w-7 text-green-600"/>
              <div>
                <h2 className="text-lg font-bold text-green-800">Reading Complete! 🎉</h2>
                <p className="text-sm text-green-600">You earned {sessionXP} XP this session</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {unit.paragraphs.map((para: any, i: number) => {
                const state = paragraphs[para.id]
                return (
                  <div key={para.id} className={`text-center p-2 rounded-lg text-xs font-medium ${state?.completionType==="strong"?"bg-green-100 text-green-700":state?.completionType==="reviewed"?"bg-blue-100 text-blue-700":state?.completionType==="ai_assisted"?"bg-orange-100 text-orange-700":"bg-gray-100 text-gray-400"}`}>
                    <div className="text-lg mb-0.5">{state?.completionType==="strong"?"💪":state?.completionType==="reviewed"?"📝":state?.completionType==="ai_assisted"?"🤖":"○"}</div>
                    Para {i+1}
                  </div>
                )
              })}
            </div>
            <Button onClick={()=>router.push(`/dashboard/unit/${unit.id}/quiz`)} className="w-full bg-green-600 hover:bg-green-700">Continue to Comprehension Quiz →</Button>
          </div>
        )}
      </div>
    </div>
  )
}
