import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { getStudentUnitProgress } from "@/lib/db/queries/progress.queries"
import Link from "next/link"
import { ArrowLeft, Lock, CheckCircle, PlayCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
const STEPS = [
  {id:1,label:"Pre-Reading",phase:"input",path:"pre-reading"},
  {id:2,label:"Vocabulary Preview",phase:"input",path:"vocabulary"},
  {id:3,label:"Reading Passage",phase:"input",path:"reading"},
  {id:4,label:"Reading Comprehension",phase:"practice",path:"quiz"},
  {id:5,label:"Idiomatic Expressions",phase:"practice",path:"idioms"},
  {id:6,label:"Grammar",phase:"practice",path:"grammar"},
  {id:7,label:"Listening",phase:"practice",path:"listening"},
  {id:8,label:"Discussion",phase:"output",path:"discussion"},
  {id:9,label:"Writing",phase:"output",path:"writing"},
  {id:10,label:"Vocabulary Review",phase:"output",path:"vocabulary-review"},
]
const PHASE_COLORS: Record<string,string> = {input:"bg-blue-100 text-blue-700",practice:"bg-purple-100 text-purple-700",output:"bg-green-100 text-green-700"}
interface Props { params: { unitId: string } }
export default async function UnitPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.enrollmentId) redirect("/dashboard")
  const unitData = await getStudentUnitProgress(session.user.enrollmentId, params.unitId)
  if (!unitData) redirect("/dashboard/course")
  const { unit, progress } = unitData
  const progressMap = new Map(progress.map((p) => [p.stepTypeId, p]))
  const passedSteps = progress.filter((p) => ["passed","completed"].includes(p.status)).length
  const pct = Math.round((passedSteps / 10) * 100)
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/dashboard/course" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"><ArrowLeft className="h-4 w-4"/>Back to Course</Link>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Unit {unit.unitNumber}</span>
          <Badge variant="outline" className="text-xs">{unit.category}</Badge>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{unit.title}</h1>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5"><span>{passedSteps}/10 steps</span><span className="font-semibold text-blue-600">{pct}%</span></div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width:`${pct}%` }}/></div>
        </div>
      </div>
      <div className="space-y-2">
        {STEPS.map((step) => {
          const prog = progressMap.get(step.id)
          const status = prog?.status ?? "locked"
          const isLocked = status === "locked"
          const isPassed = ["passed","completed"].includes(status)
          const isCurrent = ["unlocked","in_progress"].includes(status)
          return (
            <div key={step.id} className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all",isPassed?"bg-green-50 border-green-200":isCurrent?"bg-blue-50 border-blue-200 shadow-sm":"bg-gray-50 border-gray-100 opacity-60")}>
              <div className={cn("flex items-center justify-center h-9 w-9 rounded-full shrink-0 border-2",isPassed?"border-green-400 bg-green-400":isCurrent?"border-blue-400 bg-blue-400":"border-gray-200 bg-white")}>
                {isPassed?<CheckCircle className="h-5 w-5 text-white"/>:isCurrent?<PlayCircle className="h-5 w-5 text-white"/>:<Lock className="h-4 w-4 text-gray-300"/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-gray-900">{step.label}</span>
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full",PHASE_COLORS[step.phase])}>{step.phase}</span>
                </div>
                {prog?.bestScore!=null&&<span className="text-xs text-gray-500">Best: {Math.round(prog.bestScore)}%</span>}
              </div>
              {!isLocked&&(
                <Link href={`/dashboard/unit/${unit.id}/${step.path}`} className={cn("shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors",isPassed?"bg-gray-100 text-gray-600 hover:bg-gray-200":"bg-blue-600 text-white hover:bg-blue-700")}>
                  {isPassed?"Review":isCurrent?"Continue":"Start"}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
