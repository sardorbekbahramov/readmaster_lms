"use client"

import { useState, Suspense } from "react" // <-- Suspense import qilindi
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

// 1. Asosiy mantiqni LoginForm komponentiga o'giramiz
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"
  const [showPw, setShowPw] = useState(false)
  const [authError, setAuthError] = useState<string|null>(null)
  
  const { register, handleSubmit, formState:{errors,isSubmitting} } = useForm<LoginInput>({ 
    resolver: zodResolver(loginSchema) 
  })
  
  const onSubmit = async (data: LoginInput) => {
    setAuthError(null)
    const result = await signIn("credentials", { email: data.email, password: data.password, redirect: false })
    if (result?.error) { setAuthError("Incorrect email or password."); return }
    router.push(callbackUrl); router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2.5 bg-blue-600 rounded-xl"><BookOpen className="h-6 w-6 text-white"/></div>
          <span className="text-2xl font-bold text-gray-900">ReadMaster</span>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
          <p className="text-gray-500 text-sm mb-6">Welcome back — let's continue learning</p>
          {authError&&<div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{authError}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...register("email")} type="email" autoFocus className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your@email.com"/>
              {errors.email&&<p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input {...register("password")} type={showPw?"text":"password"} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" placeholder="••••••••"/>
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPw?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>
              </div>
              {errors.password&&<p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <div className="flex justify-end"><Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link></div>
            <Button type="submit" disabled={isSubmitting} className="w-full h-11">
              {isSubmitting?<><Loader2 className="h-4 w-4 animate-spin"/>Signing in...</>:"Sign In"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">Don't have an account?{" "}<Link href="/register" className="text-blue-600 font-medium hover:underline">Register</Link></p>
        </div>
      </div>
    </div>
  )
}

// 2. Next.js 15 talab qilganidek, asosiy sahifani Suspense ichida eksport qilamiz
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}