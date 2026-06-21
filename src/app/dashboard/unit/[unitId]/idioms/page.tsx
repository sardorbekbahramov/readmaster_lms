import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { QuizClient } from "../quiz/quiz-client"
interface Props { params: { unitId: string } }
export default async function IdiomsPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.enrollmentId) redirect("/dashboard")
  const unit = await prisma.unit.findUnique({ where: { id: params.unitId, isActive: true }, include: { lessons: { take: 1, include: { questions: { where: { stepTypeId: 5 }, include: { options: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } } } } } })
  if (!unit) redirect("/dashboard/course")
  return <QuizClient unitId={unit.id} unitTitle={unit.title} unitNumber={unit.unitNumber} questions={unit.lessons[0]?.questions??[]} stepTypeId={5} stepLabel="Idiomatic Expressions" stepNumber={5} nextPath="grammar" enrollmentId={session.user.enrollmentId!} userId={session.user.id} passThreshold={70}/>
}
