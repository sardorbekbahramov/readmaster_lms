import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { QuizClient } from "../quiz/quiz-client"
import { Headphones } from "lucide-react"
interface Props { params: { unitId: string } }
export default async function ListeningPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.enrollmentId) redirect("/dashboard")
  const unit = await prisma.unit.findUnique({ where: { id: params.unitId, isActive: true }, include: { listeningTask: true, lessons: { take: 1, include: { questions: { where: { stepTypeId: 7 }, include: { options: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } } } } } })
  if (!unit) redirect("/dashboard/course")
  return (
    <div>
      {unit.listeningTask && (
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <div className="bg-white rounded-xl border p-5 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Headphones className="h-5 w-5 text-blue-600"/></div>
              <div>
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Step 7 — Listening</p>
                <p className="font-semibold text-gray-900">{unit.listeningTask.dialogTitle}</p>
              </div>
            </div>
            {unit.listeningTask.isAudioReady && unit.listeningTask.audioUrl
              ? <audio controls className="w-full" src={unit.listeningTask.audioUrl}>Your browser does not support audio.</audio>
              : <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-center"><Headphones className="h-8 w-8 text-gray-300 mx-auto mb-2"/><p className="text-sm text-gray-400">Audio not yet uploaded by your teacher.</p></div>}
          </div>
        </div>
      )}
      <QuizClient unitId={unit.id} unitTitle={unit.title} unitNumber={unit.unitNumber} questions={unit.lessons[0]?.questions??[]} stepTypeId={7} stepLabel="Listening Comprehension" stepNumber={7} nextPath="discussion" enrollmentId={session.user.enrollmentId!} userId={session.user.id} passThreshold={60}/>
    </div>
  )
}
