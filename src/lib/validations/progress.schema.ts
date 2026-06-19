import { z } from "zod"
export const paragraphAttemptSchema = z.object({
  paragraphId: z.string().cuid(), enrollmentId: z.string().cuid(), unitId: z.string().cuid(),
  paragraphIndex: z.number().int().min(0).max(20),
  answer: z.enum(["a","b","c"]),
  attemptNumber: z.number().int().min(1).max(2),
  readingStartedAt: z.number().int(),
  readingDurationSec: z.number().int().min(0).max(7200),
  audioPlayed: z.boolean().optional().default(false),
  confidenceRating: z.enum(["clear","think_so","unsure"]).optional(),
})
export const writingSubmitSchema = z.object({
  enrollmentId: z.string().cuid(), unitId: z.string().cuid(),
  lessonId: z.string().cuid(), stepAttemptId: z.string().cuid(),
  text: z.string().min(10).max(1500)
    .refine((t) => t.trim().split(/\s+/).filter(Boolean).length >= 60, "Min 60 words")
    .refine((t) => t.trim().split(/\s+/).filter(Boolean).length <= 150, "Max 150 words"),
  attemptNumber: z.number().int().min(1).max(5),
})
export type ParagraphAttemptInput = z.infer<typeof paragraphAttemptSchema>
export type WritingSubmitInput    = z.infer<typeof writingSubmitSchema>
