"use client"
import { cn } from "@/lib/utils"
import { CheckCircle, Circle, Loader2 } from "lucide-react"
import { useReadingStore, type CompletionType } from "@/stores/reading.store"
export function ReadingProgressStrip({ paragraphIds, unitTitle }: { paragraphIds:string[]; unitTitle:string }) {
  const paragraphs = useReadingStore((s) => s.paragraphs)
  const currentIndex = useReadingStore((s) => s.currentParaIndex)
  const sessionXP = useReadingStore((s) => s.sessionXP)
  const getColor = (t:CompletionType) => t==="strong"?"bg-green-500":t==="reviewed"?"bg-blue-500":t==="ai_assisted"?"bg-orange-400":"bg-gray-200"
  return (
    <div className="sticky top-0 z-20 bg-white border-b shadow-sm px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Reading</span>
            <span className="text-sm text-gray-400">·</span>
            <span className="text-sm font-semibold text-gray-700 truncate max-w-[180px]">{unitTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{Math.min(currentIndex,paragraphIds.length)}/{paragraphIds.length}</span>
            {sessionXP>0&&<span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">+{sessionXP} XP</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {paragraphIds.map((id,i) => {
            const state = paragraphs[id]
            const isActive = ["reading","questioning","answered"].includes(state?.status??"")
            const isComplete = state?.status==="complete"
            return (
              <div key={id} className="flex-1 flex flex-col items-center gap-1">
                <div className={cn("h-2 w-full rounded-full transition-all duration-500",isComplete?getColor(state.completionType):isActive?"bg-blue-200 animate-pulse":"bg-gray-100")} />
                <div className="h-4 flex items-center justify-center">
                  {isComplete?<CheckCircle className={cn("h-3.5 w-3.5",state.completionType==="strong"?"text-green-500":state.completionType==="reviewed"?"text-blue-500":"text-orange-400")} />:isActive?<Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />:<Circle className="h-3.5 w-3.5 text-gray-200" />}
                </div>
                <span className="text-[10px] text-gray-400">{i+1}</span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          {[{color:"bg-green-500",label:"Strong"},{color:"bg-blue-500",label:"Reviewed"},{color:"bg-orange-400",label:"AI-assisted"}].map(({color,label})=>(
            <div key={label} className="flex items-center gap-1"><div className={cn("h-1.5 w-3 rounded-full",color)}/><span className="text-[10px] text-gray-400">{label}</span></div>
          ))}
        </div>
      </div>
    </div>
  )
}
