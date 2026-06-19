import { groq, BASE_CONFIG } from "@/lib/ai/groq"
import { sanitizeInput, sanitizeJsonResponse } from "@/lib/ai/sanitize"
import { prisma } from "@/lib/db/prisma"
export interface WritingEvalOutput { scoreContent:number; scoreStructure:number; scoreGrammar:number; scoreVocab:number; totalScore:number; pass:boolean; narrativeFeedback:string; suggestions:string[]; vocabularyUsed:string[]; flagForTeacher:boolean }
const PENDING:WritingEvalOutput={scoreContent:0,scoreStructure:0,scoreGrammar:0,scoreVocab:0,totalScore:0,pass:false,flagForTeacher:true,narrativeFeedback:"AI review unavailable. Teacher will review.",suggestions:[],vocabularyUsed:[]}
function validate(d:WritingEvalOutput):WritingEvalOutput{const c=Math.min(3,Math.max(0,Math.round(d.scoreContent??0))),s=Math.min(3,Math.max(0,Math.round(d.scoreStructure??0))),g=Math.min(2,Math.max(0,Math.round(d.scoreGrammar??0))),v=Math.min(2,Math.max(0,Math.round(d.scoreVocab??0))),total=c+s+g+v;return{...d,scoreContent:c,scoreStructure:s,scoreGrammar:g,scoreVocab:v,totalScore:total,pass:total>=6,flagForTeacher:total<5,suggestions:Array.isArray(d.suggestions)?d.suggestions.slice(0,3):[],vocabularyUsed:Array.isArray(d.vocabularyUsed)?d.vocabularyUsed:[]}}
export async function evaluateWriting(input:{studentText:string;writingTopic:string;guideQuestions:string[];targetVocabulary:string[];studentCefr:string;attemptNumber:number;userId:string;attemptId:string}):Promise<WritingEvalOutput>{
  const t=Date.now()
  try{
    const clean=sanitizeInput(input.studentText,1500)
    const wc=clean.trim().split(/\s+/).filter(Boolean).length
    if(wc<60)return{...PENDING,pass:false,flagForTeacher:false,narrativeFeedback:"Too short. Please write at least 60 words."}
    const completion=await groq.chat.completions.create({...BASE_CONFIG,max_tokens:512,messages:[
      {role:"system",content:`You are an English writing evaluator. NEVER say "Great job!". Write at/below CEFR: ${input.studentCefr}. Return JSON: {"scoreContent":0-3,"scoreStructure":0-3,"scoreGrammar":0-2,"scoreVocab":0-2,"totalScore":0-10,"pass":bool,"narrativeFeedback":"...","suggestions":["..."],"vocabularyUsed":["..."],"flagForTeacher":bool}`},
      {role:"user",content:`TOPIC: ${input.writingTopic}\nQUESTIONS:\n${input.guideQuestions.map((q,i)=>`${i+1}. ${q}`).join("\n")}\nVOCABULARY: ${input.targetVocabulary.join(", ")}\nATTEMPT: ${input.attemptNumber}\nTEXT:\n${clean}\nWord count: ${wc}. Return JSON only.`},
    ]})
    const raw=completion.choices[0]?.message?.content??""
    const v=validate(JSON.parse(sanitizeJsonResponse(raw)) as WritingEvalOutput)
    await prisma.aiFeedbackLog.create({data:{userId:input.userId,attemptId:input.attemptId,feedbackType:"writing_evaluator",promptText:input.writingTopic.slice(0,200),responseText:raw.slice(0,2000),modelVersion:BASE_CONFIG.model,tokensUsed:completion.usage?.total_tokens,latencyMs:Date.now()-t}})
    return v
  }catch{return PENDING}
}
