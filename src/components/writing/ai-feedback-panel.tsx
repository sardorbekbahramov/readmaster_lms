"use client"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
const CRITERIA = [
  {key:"scoreContent",label:"Content",max:3},{key:"scoreStructure",label:"Structure",max:3},
  {key:"scoreGrammar",label:"Grammar",max:2},{key:"scoreVocab",label:"Vocabulary",max:2},
] as const
export function AiFeedbackPanel({ evaluation, onRevise, onContinue }: { evaluation:any; onRevise?:()=>void; onContinue?:()=>void }) {
  const [showSugg, setShowSugg] = useState(true)
  const sc=(score:number,max:number)=>{const p=score/max;return p>=0.7?"text-green-600":p>=0.4?"text-yellow-600":"text-red-600"}
  const bc=(score:number,max:number)=>{const p=score/max;return p>=0.7?"bg-green-400":p>=0.4?"bg-yellow-400":"bg-red-400"}
  return (
    <div className={cn("rounded-2xl border-2 p-5 space-y-4",evaluation.pass?"border-green-200 bg-green-50":"border-orange-200 bg-orange-50")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {evaluation.pass?<CheckCircle className="h-5 w-5 text-green-600"/>:<AlertCircle className="h-5 w-5 text-orange-500"/>}
          <h3 className="font-bold text-gray-900">{evaluation.pass?"Writing Passed ✓":"Keep Improving"}</h3>
        </div>
        <span className={cn("text-3xl font-bold",evaluation.pass?"text-green-700":"text-orange-700")}>{evaluation.totalScore}/10</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CRITERIA.map(({key,label,max})=>{const score=evaluation[key];return(
          <div key={key} className="bg-white rounded-xl p-3 border">
            <div className="flex justify-between mb-1.5"><span className="text-xs text-gray-500">{label}</span><span className={cn("text-sm font-bold",sc(score,max))}>{score}/{max}</span></div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={cn("h-full rounded-full",bc(score,max))} style={{width:`${(score/max)*100}%`}}/></div>
          </div>
        )})}
      </div>
      <div className="bg-white rounded-xl p-4 border"><p className="text-xs font-semibold text-gray-500 mb-1">AI Feedback</p><p className="text-sm text-gray-700 leading-relaxed">{evaluation.narrativeFeedback}</p></div>
      {evaluation.suggestions?.length>0&&(
        <div className="bg-white rounded-xl border overflow-hidden">
          <button onClick={()=>setShowSugg(!showSugg)} className="flex items-center justify-between w-full px-4 py-3">
            <span className="text-sm font-semibold text-gray-700">💬 {evaluation.suggestions.length} Suggestions</span>
            {showSugg?<ChevronUp className="h-4 w-4 text-gray-400"/>:<ChevronDown className="h-4 w-4 text-gray-400"/>}
          </button>
          {showSugg&&<div className="px-4 pb-4 space-y-2">{evaluation.suggestions.map((s:string,i:number)=>(
            <div key={i} className="flex gap-2 text-sm text-gray-600"><span className="font-bold text-blue-500 shrink-0">{i+1}.</span><span>{s}</span></div>
          ))}</div>}
        </div>
      )}
      {evaluation.flagForTeacher&&<div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">📋 Your teacher has been notified to review this.</div>}
      <div className="flex gap-3">
        {evaluation.pass
          ?<button onClick={onContinue} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-green-700">Continue to Vocabulary Review →</button>
          :<button onClick={onRevise} className="flex-1 border border-orange-300 text-orange-700 py-2.5 rounded-xl font-medium text-sm hover:bg-orange-50">Revise and Resubmit</button>
        }
      </div>
    </div>
  )
}
