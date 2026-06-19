import { DefaultSession } from "next-auth"
declare module "next-auth" {
  interface Session {
    user: {
      id: string; role: string; institutionId?: string
      enrollmentId?: string; xpTotal: number; level: number
      onboardingComplete: boolean
    } & DefaultSession["user"]
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    role?: string; institutionId?: string; enrollmentId?: string
    xpTotal?: number; level?: number; onboardingComplete?: boolean
  }
}
