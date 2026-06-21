import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { QuizClient } from "./quiz-client"
interface Props { params: { unitId: string } }
export default async function QuizPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.enrollmentId) redirect("/dashboard")
  const unit = await prisma.unit.findUnique({ where: { id: params.unitId, isActive: true }, include: { lessons: { take: 1, include: { questions: { where: { stepTypeId: 4 }, include: { options: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } } } } } })
  if (!unit) redirect("/dashboard/course")
  return <QuizClient unitId={unit.id} unitTitle={unit.title} unitNumber={unit.unitNumber} questions={unit.lessons[0]?.questions??[]} stepTypeId={4} stepLabel="Reading Comprehension" stepNumber={4} nextPath="idioms" enrollmentId={session.user.enrollmentId!} userId={session.user.id} passThreshold={60}/>
}
