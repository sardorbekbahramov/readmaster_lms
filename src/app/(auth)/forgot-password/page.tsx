"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth.schema"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")
  const { register, handleSubmit, formState:{errors,isSubmitting} } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })
  const onSubmit = async (data: ForgotPasswordInput) => {
    await fetch("/api/auth/forgot-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)})
    setSentEmail(data.email); setSent(true)
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2.5 bg-blue-600 rounded-xl"><BookOpen className="h-6 w-6 text-white"/></div>
          <span className="text-2xl font-bold text-gray-900">ReadMaster</span>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!sent?(<>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset password</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send a reset link.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input {...register("email")} type="email" autoFocus className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your@email.com"/>
                {errors.email&&<p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-11">
                {isSubmitting?<><Loader2 className="h-4 w-4 animate-spin"/>Sending...</>:"Send Reset Link"}
              </Button>
            </form>
          </>):(
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100"><Mail className="h-7 w-7 text-green-600"/></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-500 mb-6">Reset link sent to <span className="font-medium text-gray-700">{sentEmail}</span>. Expires in 1 hour.</p>
              <Button variant="outline" className="w-full" onClick={()=>setSent(false)}>Resend email</Button>
            </div>
          )}
          <div className="mt-6 text-center"><Link href="/login" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"><ArrowLeft className="h-3.5 w-3.5"/>Back to sign in</Link></div>
        </div>
      </div>
    </div>
  )
}
