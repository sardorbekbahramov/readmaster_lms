import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { ReadingPageClient } from "./reading-client"
interface Props { params: { unitId: string } }
export default async function ReadingPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.enrollmentId) redirect("/dashboard")
  const unit = await prisma.unit.findUnique({
    where: { id: params.unitId, isActive: true },
    include: {
      paragraphs: { orderBy: { paraIndex: "asc" } },
      lessons: { take: 1, include: { questions: { where: { stepTypeId: 3 }, include: { options: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } } } },
    },
  })
  if (!unit) redirect("/dashboard/course")
  const existingAttempts = await prisma.paragraphAttempt.findMany({
    where: { enrollmentId: session.user.enrollmentId, unitId: params.unitId },
    select: { paragraphId: true, completionStatus: true, xpAwarded: true },
  })
  return <ReadingPageClient unit={unit} enrollmentId={session.user.enrollmentId} userId={session.user.id} existingAttempts={existingAttempts} />
}
