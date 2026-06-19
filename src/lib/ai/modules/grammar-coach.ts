import { groq, BASE_CONFIG } from "@/lib/ai/groq"
import { sanitizeJsonResponse } from "@/lib/ai/sanitize"
import { prisma } from "@/lib/db/prisma"
export async function getGrammarCoach(input:{grammarTopic:string;ruleExplanation:string;exerciseSentence:string;correctAnswer:string;studentAnswer:string;passageContext:string;studentCefr:string;userId:string}):Promise<{ruleViolation:string;correctionExplanation:string;pattern:string;passageLink:string;memoryTip?:string}>{
  const fb={ruleViolation:input.grammarTopic,correctionExplanation:`Correct: "${input.correctAnswer}". ${input.ruleExplanation}`,pattern:input.ruleExplanation,passageLink:input.passageContext}
  try{
    const completion=await groq.chat.completions.create({...BASE_CONFIG,max_tokens:200,messages:[
      {role:"system",content:`Grammar coach. Max 60 words. Give reusable pattern. Write at/below CEFR: ${input.studentCefr}. Return JSON: {"ruleViolation":"...","correctionExplanation":"...","pattern":"...","passageLink":"...","memoryTip":"..."}`},
      {role:"user",content:`TOPIC: ${input.grammarTopic}\nRULE: ${input.ruleExplanation}\nEXERCISE: ${input.exerciseSentence}\nCORRECT: ${input.correctAnswer}\nSTUDENT: ${input.studentAnswer}\nPASSAGE: ${input.passageContext}`},
    ]})
    const raw=completion.choices[0]?.message?.content??""
    await prisma.aiFeedbackLog.create({data:{userId:input.userId,feedbackType:"grammar_coach",promptText:input.grammarTopic,responseText:raw.slice(0,1000),modelVersion:BASE_CONFIG.model,tokensUsed:completion.usage?.total_tokens}})
    return JSON.parse(sanitizeJsonResponse(raw))
  }catch{return fb}
}
