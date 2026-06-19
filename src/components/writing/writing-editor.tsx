"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
interface Props { value:string; onChange:(v:string)=>void; minWords:number; maxWords:number; placeholder?:string; disabled?:boolean; isSubmitting?:boolean; onSubmit:()=>void }
export function WritingEditor({ value, onChange, minWords, maxWords, placeholder, disabled, isSubmitting, onSubmit }: Props) {
  const [wordCount, setWordCount] = useState(0)
  useEffect(()=>{ setWordCount(value.trim().split(/\s+/).filter(Boolean).length) },[value])
  const isUnder=wordCount<minWords, isOver=wordCount>maxWords, canSubmit=!isUnder&&!isOver&&!isSubmitting&&!disabled
  return (
    <div className="bg-white rounded-xl border flex flex-col min-h-[260px]">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b">
        <span className="text-sm font-medium text-gray-600">Your paragraph</span>
        <span className={cn("text-sm font-semibold",isOver?"text-red-500":isUnder?"text-yellow-600":"text-green-600")}>{wordCount} / {minWords}–{maxWords} words</span>
      </div>
      <textarea value={value} onChange={(e)=>onChange(e.target.value)} disabled={disabled||isSubmitting} placeholder={placeholder??"Start writing here..."} className="flex-1 resize-none px-4 py-3 text-sm text-gray-800 leading-relaxed focus:outline-none disabled:opacity-60" rows={8}/>
      <div className="px-4 pb-4 pt-2 border-t space-y-2">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={cn("h-full rounded-full transition-all",isOver?"bg-red-400":isUnder?"bg-yellow-400":"bg-green-500")} style={{width:`${Math.min(100,(wordCount/maxWords)*100)}%`}}/></div>
        {isUnder&&<p className="text-xs text-yellow-600">{minWords-wordCount} more words needed</p>}
        {isOver&&<p className="text-xs text-red-500">{wordCount-maxWords} words over limit</p>}
        <button onClick={onSubmit} disabled={!canSubmit} className={cn("w-full h-10 rounded-lg font-medium text-sm transition-all",canSubmit?"bg-blue-600 text-white hover:bg-blue-700":"bg-gray-100 text-gray-400 cursor-not-allowed")}>
          {isSubmitting?<span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/>AI reviewing…</span>:"Submit for AI Review →"}
        </button>
      </div>
    </div>
  )
}
