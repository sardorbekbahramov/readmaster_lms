const PATTERNS = [/ignore previous instructions/i,/you are now/i,/act as/i,/\[INST\]/i,/<<SYS>>/i,/system:/i]
export function sanitizeInput(raw: string, maxLength: number): string {
  let text = raw.replace(/<[^>]*>/g, "")
  for (const p of PATTERNS) { if (p.test(text)) throw new Error("Security: Injection attempt") }
  return text.slice(0, maxLength).replace(/\s+/g, " ").trim()
}
export function sanitizeJsonResponse(raw: string): string {
  return raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim()
}
