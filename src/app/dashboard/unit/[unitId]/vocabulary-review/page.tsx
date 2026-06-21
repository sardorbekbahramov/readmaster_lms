import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { VocabularyClient } from "../vocabulary/vocabulary-client"
interface Props { params: { unitId: string } }
export default async function VocabularyReviewPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.enrollmentId) redirect("/dashboard")
  const unit = await prisma.unit.findUnique({ where: { id: params.unitId, isActive: true }, include: { vocabulary: { where: { stepTypeId: 10 }, orderBy: { sortOrder: "asc" } } } })
  if (!unit) redirect("/dashboard/course")
  return <VocabularyClient unitId={unit.id} unitTitle={unit.title} unitNumber={unit.unitNumber} vocabulary={unit.vocabulary} enrollmentId={session.user.enrollmentId!} userId={session.user.id} stepTypeId={10} nextPath="/dashboard"/>
}
