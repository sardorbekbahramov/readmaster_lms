import Link from "next/link"
import { BookOpen, Zap, Trophy, Users, CheckCircle, Brain } from "lucide-react"
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg"><BookOpen className="h-5 w-5 text-white"/></div>
            <span className="font-bold text-gray-900">ReadMaster</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Sign In</Link>
            <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Get Started Free</Link>
          </div>
        </div>
      </nav>
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium mb-6">
            <Brain className="h-4 w-4"/> AI-Powered English Reading
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Master English Reading<br/><span className="text-blue-600">One Paragraph at a Time</span>
          </h1>
          <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">ReadMaster uses AI to guide you through Reading Challenge 1 — with instant feedback, gamification, and personalized coaching at every step.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-blue-700">Start Learning Free →</Link>
            <Link href="/login" className="w-full sm:w-auto border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-gray-50">Sign In</Link>
          </div>
        </div>
      </section>
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Everything you need to succeed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {icon:BookOpen,title:"Active Reading Engine",desc:"Read one paragraph at a time. Answer a question. Unlock the next.",color:"text-blue-500 bg-blue-50"},
              {icon:Brain,title:"AI Coaching",desc:"Get instant AI explanations when you answer incorrectly.",color:"text-purple-500 bg-purple-50"},
              {icon:Zap,title:"Gamified Learning",desc:"Earn XP, level up through 7 tiers, maintain streaks, earn badges.",color:"text-yellow-500 bg-yellow-50"},
              {icon:Trophy,title:"Class Leaderboard",desc:"Weekly class rankings based on XP. Fair with privacy controls.",color:"text-green-500 bg-green-50"},
              {icon:CheckCircle,title:"AI Writing Evaluation",desc:"Submit paragraphs and get scored on 4 criteria by AI.",color:"text-teal-500 bg-teal-50"},
              {icon:Users,title:"Teacher Dashboard",desc:"Monitor students, review writing, manage classes.",color:"text-orange-500 bg-orange-50"},
            ].map(({icon:Icon,title,desc,color})=>(
              <div key={title} className="bg-white rounded-xl p-6 border hover:shadow-md transition-shadow">
                <div className={`inline-flex p-2.5 rounded-xl ${color.split(" ")[1]} mb-4`}><Icon className={`h-5 w-5 ${color.split(" ")[0]}`}/></div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 bg-blue-600 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to improve your English?</h2>
          <p className="text-blue-100 mb-8">Join students mastering Reading Challenge 1 with AI-powered guidance.</p>
          <Link href="/register" className="inline-block bg-white text-blue-600 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-blue-50">Start Free Today →</Link>
        </div>
      </section>
      <footer className="py-8 border-t px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg"><BookOpen className="h-4 w-4 text-white"/></div>
            <span className="font-bold text-gray-900 text-sm">ReadMaster LMS</span>
          </div>
          <p className="text-xs text-gray-400">© 2025 ReadMaster LMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
