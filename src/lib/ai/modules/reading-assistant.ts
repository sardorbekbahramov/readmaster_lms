import { groq, BASE_CONFIG } from "@/lib/ai/groq"
import { sanitizeInput, sanitizeJsonResponse } from "@/lib/ai/sanitize"
import { prisma } from "@/lib/db/prisma"
interface Input { paragraphText:string; questionText:string; correctAnswerText:string; studentAnswerText:string; incorrectOptions:string[]; attemptNumber:1|2; studentCefr:string; userId:string; attemptId?:string }
interface Output { explanation:string; passageRef:string; distractor:string; confidence:"high"|"medium"; summary?:string }
export async function getReadingAssistant(input: Input): Promise<Output> {
  const t=Date.now(); const fb:Output={explanation:`The correct answer is: ${input.correctAnswerText}. Re-read carefully.`,passageRef:"Please refer back to the paragraph.",distractor:"Your chosen option was not supported.",confidence:"medium"}
  try {
    const clean=sanitizeInput(input.paragraphText,2000)
    const completion=await groq.chat.completions.create({...BASE_CONFIG,max_tokens:256,messages:[
      {role:"system",content:`You are a reading comprehension coach for English learners. NEVER use empty praise. Write at/below CEFR: ${input.studentCefr}. Return JSON only: {"explanation":"...","passageRef":"...","distractor":"...","confidence":"high"|"medium"${input.attemptNumber===2?',"summary":"..."':""}}`},
      {role:"user",content:`PARAGRAPH: ${clean}\nQUESTION: ${input.questionText}\nCORRECT: ${input.correctAnswerText}\nSTUDENT: ${input.studentAnswerText}\nOTHER: ${input.incorrectOptions.join(" | ")}\nATTEMPT: ${input.attemptNumber}`},
    ]})
    const raw=completion.choices[0]?.message?.content??""
    const parsed=JSON.parse(sanitizeJsonResponse(raw)) as Output
    await prisma.aiFeedbackLog.create({data:{userId:input.userId,attemptId:input.attemptId,feedbackType:"reading_assistant",promptText:`Q:${input.questionText}`.slice(0,500),responseText:raw.slice(0,2000),modelVersion:BASE_CONFIG.model,tokensUsed:completion.usage?.total_tokens,latencyMs:Date.now()-t}})
    return parsed
  } catch { return fb }
}
