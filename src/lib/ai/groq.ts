import Groq from "groq-sdk"
const globalForGroq = globalThis as unknown as { groq: Groq | undefined }
export const groq = globalForGroq.groq ?? new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 15000, maxRetries: 2 })
if (process.env.NODE_ENV !== "production") globalForGroq.groq = groq
export const GROQ_MODEL = "llama-3.3-70b-versatile"
export const BASE_CONFIG = { model: GROQ_MODEL, temperature: 0.3, top_p: 0.9, stream: false as const }
