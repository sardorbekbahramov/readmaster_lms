import { groq, BASE_CONFIG } from "@/lib/ai/groq"
import { sanitizeJsonResponse } from "@/lib/ai/sanitize"
import { prisma } from "@/lib/db/prisma"
export async function getVocabularyCoach(input:{failedWords:Array<{word:string;definition:string}>;unitTopic:string;studentCefr:string;userId:string}):Promise<{results:Array<{word:string;sentences:string[]}>}>{
  if(input.failedWords.length===0)return{results:[]}
  try{
    const completion=await groq.chat.completions.create({...BASE_CONFIG,max_tokens:400,messages:[
      {role:"system",content:`Vocabulary coach. Create 3 natural example sentences per word. Write at/below CEFR: ${input.studentCefr}. Return JSON: {"results":[{"word":"...","sentences":["...","...","..."]}]}`},
      {role:"user",content:`TOPIC: ${input.unitTopic}\nWORDS:\n${input.failedWords.map((w)=>`${w.word}: ${w.definition}`).join("\n")}`},
    ]})
    const raw=completion.choices[0]?.message?.content??""
    await prisma.aiFeedbackLog.create({data:{userId:input.userId,feedbackType:"vocabulary_coach",promptText:input.failedWords.map((w)=>w.word).join(", ").slice(0,200),responseText:raw.slice(0,1000),modelVersion:BASE_CONFIG.model,tokensUsed:completion.usage?.total_tokens}})
    return JSON.parse(sanitizeJsonResponse(raw))
  }catch{return{results:input.failedWords.map((w)=>({word:w.word,sentences:[w.definition]}))}}
}
