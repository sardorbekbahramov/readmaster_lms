import { create } from "zustand"
export type ParaStatus = "locked"|"reading"|"questioning"|"answered"|"complete"
export type CompletionType = "strong"|"reviewed"|"ai_assisted"|null
export interface ParagraphState {
  status:ParaStatus; attemptNumber:number; isCorrect:boolean|null
  aiExplanation:string|null; aiPassageRef:string|null; aiDistractor:string|null
  xpEarned:number; completionType:CompletionType; readingStartedAt:number|null
  confidenceRating:"clear"|"think_so"|"unsure"|null
}
interface ReadingStore {
  unitId:string|null; totalParagraphs:number; paragraphs:Record<string,ParagraphState>
  currentParaIndex:number; sessionXP:number; allComplete:boolean
  initSession:(unitId:string,ids:string[])=>void
  showQuestion:(id:string)=>void
  setAnswer:(id:string,isCorrect:boolean,xp:number,t:CompletionType)=>void
  setAiExplanation:(id:string,exp:string,ref:string,dist:string)=>void
  setConfidence:(id:string,r:"clear"|"think_so"|"unsure")=>void
  completeParagraph:(id:string)=>void
  incrementAttempt:(id:string)=>void
  addSessionXP:(n:number)=>void
  reset:()=>void
}
const def=():ParagraphState=>({status:"locked",attemptNumber:1,isCorrect:null,aiExplanation:null,aiPassageRef:null,aiDistractor:null,xpEarned:0,completionType:null,readingStartedAt:null,confidenceRating:null})
export const useReadingStore=create<ReadingStore>((set)=>({
  unitId:null,totalParagraphs:0,paragraphs:{},currentParaIndex:0,sessionXP:0,allComplete:false,
  initSession:(unitId,ids)=>{const p:Record<string,ParagraphState>={};ids.forEach((id,i)=>{p[id]={...def(),status:i===0?"reading":"locked"}});set({unitId,totalParagraphs:ids.length,paragraphs:p,currentParaIndex:0,sessionXP:0,allComplete:false})},
  showQuestion:(id)=>set((s)=>({paragraphs:{...s.paragraphs,[id]:{...s.paragraphs[id],status:"questioning"}}})),
  setAnswer:(id,isCorrect,xp,t)=>set((s)=>({paragraphs:{...s.paragraphs,[id]:{...s.paragraphs[id],status:"answered",isCorrect,xpEarned:xp,completionType:t}}})),
  setAiExplanation:(id,exp,ref,dist)=>set((s)=>({paragraphs:{...s.paragraphs,[id]:{...s.paragraphs[id],aiExplanation:exp,aiPassageRef:ref,aiDistractor:dist}}})),
  setConfidence:(id,r)=>set((s)=>({paragraphs:{...s.paragraphs,[id]:{...s.paragraphs[id],confidenceRating:r}}})),
  completeParagraph:(id)=>set((s)=>{
    const ni=s.currentParaIndex+1;const ids=Object.keys(s.paragraphs);const next=ids[ni]
    const up={...s.paragraphs,[id]:{...s.paragraphs[id],status:"complete" as ParaStatus}}
    if(next)up[next]={...up[next],status:"reading" as ParaStatus,readingStartedAt:Date.now()}
    return {paragraphs:up,currentParaIndex:ni,allComplete:ni>=s.totalParagraphs}
  }),
  incrementAttempt:(id)=>set((s)=>({paragraphs:{...s.paragraphs,[id]:{...s.paragraphs[id],attemptNumber:s.paragraphs[id].attemptNumber+1}}})),
  addSessionXP:(n)=>set((s)=>({sessionXP:s.sessionXP+n})),
  reset:()=>set({unitId:null,totalParagraphs:0,paragraphs:{},currentParaIndex:0,sessionXP:0,allComplete:false}),
}))
