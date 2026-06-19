"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth.schema"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [showPw, setShowPw] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const { register, handleSubmit, formState:{errors,isSubmitting} } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) })
  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null)
    try {
      const res = await fetch("/api/auth/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,password:data.password})})
      if (!res.ok){const d=await res.json();setError(d.error??"Reset failed.");return}
      setSuccess(true)
      setTimeout(()=>router.push("/login"),2000)
    } catch { setError("Something went wrong.") }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2.5 bg-blue-600 rounded-xl"><BookOpen className="h-6 w-6 text-white"/></div>
          <span className="text-2xl font-bold text-gray-900">ReadMaster</span>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!success ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Set new password</h1>
              <p className="text-gray-500 text-sm mb-6">Enter your new password below.</p>
              {error&&<div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...register("token")} value={token}/>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input {...register("password")} type={showPw?"text":"password"} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" placeholder="Min 8 characters"/>
                    <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPw?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>
                  </div>
                  {errors.password&&<p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input {...register("confirmPassword")} type="password" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Repeat password"/>
                  {errors.confirmPassword&&<p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-11">
                  {isSubmitting?<><Loader2 className="h-4 w-4 animate-spin"/>Setting password...</>:"Set New Password"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h2>
              <p className="text-sm text-gray-500">Redirecting you to login...</p>
            </div>
          )}
          <div className="mt-6 text-center"><Link href="/login" className="text-sm text-blue-600 hover:underline">Back to Sign In</Link></div>
        </div>
      </div>
    </div>
  )
}
