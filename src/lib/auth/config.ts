import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) })

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          include: { roles: true, xpLedger: true, enrollments: { where: { status: "active" }, take: 1, select: { id: true } } },
        })
        if (dbUser) {
          token.role         = dbUser.roles[0]?.role ?? "student"
          token.institutionId= dbUser.institutionId
          token.enrollmentId = dbUser.enrollments[0]?.id
          token.xpTotal      = dbUser.xpLedger?.totalXp ?? 0
          token.level        = dbUser.xpLedger?.currentLevel ?? 1
          token.onboardingComplete = dbUser.onboardingComplete
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id               = token.sub as string
      session.user.role             = token.role as string
      session.user.institutionId    = token.institutionId as string | undefined
      session.user.enrollmentId     = token.enrollmentId as string | undefined
      session.user.xpTotal          = token.xpTotal as number
      session.user.level            = token.level as number
      session.user.onboardingComplete = token.onboardingComplete as boolean
      return session
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null
        const { email, password } = parsed.data
        const user = await prisma.user.findUnique({ where: { email, isActive: true } })
        if (!user) return null
        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
        return { id: user.id, email: user.email, name: user.fullName, image: user.avatarUrl }
      },
    }),
  ],
  pages: { signIn: "/login", signOut: "/login", error: "/login" },
})
