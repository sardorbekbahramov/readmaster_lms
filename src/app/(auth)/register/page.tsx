"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth.schema"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
export default function RegisterPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState<string|null>(null)
  const { register, handleSubmit, watch, formState:{errors,isSubmitting} } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })
  const pw = watch("password","")
  const strength = !pw?0:pw.length>=8&&/[A-Z]/.test(pw)&&/[0-9]/.test(pw)?3:pw.length>=8?2:1
  const onSubmit = async (data: RegisterInput) => {
    setServerError(null)
    try {
      const res = await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fullName:data.fullName,email:data.email,password:data.password,classCode:data.classCode})})
      const json = await res.json()
      if (!res.ok){setServerError(json.error??"Registration failed.");return}
      await signIn("credentials",{email:data.email,password:data.password,redirect:false})
      router.push("/dashboard"); router.refresh()
    } catch { setServerError("Something went wrong.") }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2.5 bg-blue-600 rounded-xl"><BookOpen className="h-6 w-6 text-white"/></div>
          <span className="text-2xl font-bold text-gray-900">ReadMaster</span>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
          <p className="text-gray-500 text-sm mb-6">Start your English reading journey</p>
          {serverError&&<div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{serverError}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input {...register("fullName")} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your full name"/>
              {errors.fullName&&<p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...register("email")} type="email" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your@email.com"/>
              {errors.email&&<p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input {...register("password")} type={showPw?"text":"password"} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" placeholder="Min 8 chars, uppercase & number"/>
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPw?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button>
              </div>
              {pw&&<div className="mt-1.5 flex gap-1">{[1,2,3].map((i)=><div key={i} className={`h-1 flex-1 rounded-full ${strength>=i?i===3?"bg-green-500":i===2?"bg-yellow-400":"bg-red-400":"bg-gray-100"}`}/>)}</div>}
              {errors.password&&<p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input {...register("confirmPassword")} type="password" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Repeat password"/>
              {errors.confirmPassword&&<p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Code <span className="text-gray-400 font-normal">(optional)</span></label>
              <input {...register("classCode")} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="Ask your teacher"/>
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input {...register("acceptTerms")} type="checkbox" className="mt-0.5 h-4 w-4 rounded border-gray-300"/>
              <span className="text-sm text-gray-600">I accept the <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link></span>
            </label>
            {errors.acceptTerms&&<p className="text-xs text-red-600">{errors.acceptTerms.message}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-full h-11">
              {isSubmitting?<><Loader2 className="h-4 w-4 animate-spin"/>Creating account...</>:"Create Account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">Already have an account?{" "}<Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}
