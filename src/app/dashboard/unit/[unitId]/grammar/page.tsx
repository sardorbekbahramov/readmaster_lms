import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { GrammarClient } from "./grammar-client"
interface Props { params: { unitId: string } }
export default async function GrammarPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.enrollmentId) redirect("/dashboard")
  const unit = await prisma.unit.findUnique({ where: { id: params.unitId, isActive: true }, include: { grammarTopic: true, lessons: { take: 1, include: { questions: { where: { stepTypeId: 6 }, include: { options: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } } } } } })
  if (!unit?.grammarTopic) redirect(`/dashboard/unit/${params.unitId}`)
  return <GrammarClient unitId={unit.id} unitTitle={unit.title} unitNumber={unit.unitNumber} grammarTopic={unit.grammarTopic} questions={unit.lessons[0]?.questions??[]} enrollmentId={session.user.enrollmentId!} userId={session.user.id}/>
}
