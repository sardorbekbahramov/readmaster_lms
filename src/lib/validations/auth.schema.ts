import { z } from "zod"
export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8).max(128),
})
export const registerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain number"),
  confirmPassword: z.string(),
  classCode: z.string().optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Accept terms to continue" }) }),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] })
export const forgotPasswordSchema = z.object({ email: z.string().email() })
export type LoginInput    = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] })
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
