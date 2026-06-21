import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { WritingClient } from "./writing-client"
interface Props { params: { unitId: string } }
export default async function WritingPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.enrollmentId) redirect("/dashboard")
  const unit = await prisma.unit.findUnique({ where: { id: params.unitId, isActive: true }, include: { writingTask: true, vocabulary: { where: { stepTypeId: 2 }, select: { word: true } }, lessons: { take: 1, select: { id: true } } } })
  if (!unit?.writingTask) redirect(`/dashboard/unit/${params.unitId}`)
  return <WritingClient unitId={unit.id} unitTitle={unit.title} unitNumber={unit.unitNumber} writingTask={unit.writingTask} targetVocabulary={unit.vocabulary.map((v)=>v.word)} lessonId={unit.lessons[0]?.id??""} enrollmentId={session.user.enrollmentId!} userId={session.user.id}/>
}
