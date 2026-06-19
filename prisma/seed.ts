import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
const prisma = new PrismaClient()
async function main() {
  console.log("🌱 Seeding...")
  const institution = await prisma.institution.upsert({ where: { slug: "default" }, update: {}, create: { name: "ReadMaster Default", slug: "default", institutionType: "center", timezone: "Asia/Tashkent" } })
  const adminHash = await bcrypt.hash("Admin123!", 12)
  await prisma.user.upsert({ where: { email: "admin@readmaster.app" }, update: {}, create: { email: "admin@readmaster.app", passwordHash: adminHash, fullName: "Admin User", institutionId: institution.id, emailVerified: true, isActive: true, roles: { create: { role: "admin" } } } })
  const teacherHash = await bcrypt.hash("Teacher123!", 12)
  const teacher = await prisma.user.upsert({ where: { email: "teacher@readmaster.app" }, update: {}, create: { email: "teacher@readmaster.app", passwordHash: teacherHash, fullName: "Demo Teacher", institutionId: institution.id, emailVerified: true, isActive: true, roles: { create: { role: "teacher" } } } })
  const course = await prisma.course.upsert({ where: { slug: "reading-challenge-1" }, update: {}, create: { slug: "reading-challenge-1", title: "Reading Challenge 1", author: "Casey Malarcher, Andrea Janzen", publisher: "Compass Publishing", totalUnits: 20, cefrLevel: "A2-B1", isActive: true } })
  const units = [
    {n:1,title:"The Ice Hotel",cat:"Arts and Leisure"},{n:2,title:"Food Firsts",cat:"Weird and Bizarre"},
    {n:3,title:"Hurricane Who?",cat:"Science Facts"},{n:4,title:"Butterflies in My Stomach",cat:"Health"},
    {n:5,title:"A Bug's Sleep",cat:"Science Facts"},{n:6,title:"Tiger's Tale",cat:"People Profiles"},
    {n:7,title:"Not the Normal News",cat:"Social Science"},{n:8,title:"The Wright Way to Fly",cat:"Culture and History"},
    {n:9,title:"Don't Trust Me!",cat:"Social Science"},{n:10,title:"Bugs for Sale",cat:"Weird and Bizarre"},
    {n:11,title:"Mona Who?",cat:"Arts and Leisure"},{n:12,title:"Borrowed Words",cat:"Culture and History"},
    {n:13,title:"Growing Deserts",cat:"Environment"},{n:14,title:"The Importance of Water",cat:"Health"},
    {n:15,title:"Animal Forecasters",cat:"Science Facts"},{n:16,title:"A Fantastic Mind",cat:"People Profiles"},
    {n:17,title:"Seeing Red",cat:"Science Facts"},{n:18,title:"Worth Collecting",cat:"Sports and Hobbies"},
    {n:19,title:"Can't Beat Them? Join Them!",cat:"Technology"},{n:20,title:"Rich Dogs",cat:"Weird and Bizarre"},
  ]
  for (const u of units) {
    const unit = await prisma.unit.upsert({ where: { courseId_unitNumber: { courseId: course.id, unitNumber: u.n } }, update: {}, create: { courseId: course.id, unitNumber: u.n, title: u.title, category: u.cat, sortOrder: u.n, isActive: true } })
    await prisma.lesson.upsert({ where: { unitId_lessonNumber: { unitId: unit.id, lessonNumber: 1 } }, update: {}, create: { unitId: unit.id, lessonNumber: 1, sortOrder: 1, isActive: true } })
    await prisma.writingTask.upsert({ where: { unitId: unit.id }, update: {}, create: { unitId: unit.id, topic: `Write about: ${u.title}`, guideQuestions: ["What is the main topic?","What did you find interesting?","How does it relate to your life?","What is your opinion?"], exampleText: `This passage discusses ${u.title.toLowerCase()}. It presents interesting facts that help readers understand the topic.`, minWords: 60, maxWords: 150, scoringRubric: [{criterion:"Content",maxScore:3},{criterion:"Structure",maxScore:3},{criterion:"Grammar",maxScore:2},{criterion:"Vocabulary",maxScore:2}] } })
  }
  const cls = await prisma.class.upsert({ where: { classCode: "DEMO2025" }, update: {}, create: { institutionId: institution.id, teacherId: teacher.id, courseId: course.id, name: "Demo Class — RC1", classCode: "DEMO2025", maxStudents: 30, unlockMode: "sequential", leaderboardVisible: true, isActive: true } })
  const first3 = await prisma.unit.findMany({ where: { courseId: course.id, unitNumber: { lte: 3 } } })
  for (const unit of first3) {
    await prisma.classUnitAssignment.upsert({ where: { classId_unitId: { classId: cls.id, unitId: unit.id } }, update: { isUnlocked: true }, create: { classId: cls.id, unitId: unit.id, isUnlocked: true, assignedBy: teacher.id } })
  }
  const studentHash = await bcrypt.hash("Student123!", 12)
  const student = await prisma.user.upsert({ where: { email: "student@readmaster.app" }, update: {}, create: { email: "student@readmaster.app", passwordHash: studentHash, fullName: "Demo Student", displayName: "DemoStudent", institutionId: institution.id, emailVerified: true, isActive: true, onboardingComplete: true, roles: { create: { role: "student" } } } })
  await prisma.enrollment.upsert({ where: { classId_studentId: { classId: cls.id, studentId: student.id } }, update: {}, create: { classId: cls.id, studentId: student.id, status: "active" } })
  await prisma.xpLedger.upsert({ where: { userId: student.id }, update: {}, create: { userId: student.id, totalXp: 250, currentLevel: 1, levelTitle: "Reader Rookie" } })
  await prisma.streak.upsert({ where: { userId: student.id }, update: {}, create: { userId: student.id, currentStreak: 3, longestStreak: 3, shieldsAvailable: 1 } })
  const achievements = [
    {code:"unit_1_complete",name:"Ice Breaker",description:"Complete Unit 1",category:"unit" as const,xpReward:0,triggerRule:{type:"unit_complete",unit_number:1}},
    {code:"streak_7",name:"Week Warrior",description:"7-day learning streak",category:"consistency" as const,xpReward:100,triggerRule:{type:"streak_milestone",days:7}},
    {code:"streak_14",name:"Fortnight Scholar",description:"14-day learning streak",category:"consistency" as const,xpReward:250,triggerRule:{type:"streak_milestone",days:14}},
    {code:"streak_30",name:"Monthly Legend",description:"30-day learning streak",category:"consistency" as const,xpReward:500,triggerRule:{type:"streak_milestone",days:30}},
    {code:"comeback_kid",name:"Comeback Kid",description:"Pass a step after 5+ fails",category:"effort" as const,xpReward:50,triggerRule:{type:"pass_after_fails",min_fails:5}},
    {code:"halfway",name:"Halfway There",description:"Complete Units 1–10",category:"unit" as const,xpReward:100,triggerRule:{type:"all_units_complete",min_units:10}},
    {code:"course_champion",name:"Course Champion",description:"Complete all 20 units",category:"unit" as const,xpReward:500,triggerRule:{type:"all_units_complete",min_units:20}},
    {code:"night_owl",name:"Night Owl",description:"Complete a step after 22:00",category:"effort" as const,xpReward:20,triggerRule:{type:"step_at_hour",hour_after:22},isSecret:false},
    {code:"ghost_reader",name:"Ghost Reader",description:"Perfect unit in under 10 min",category:"challenge" as const,xpReward:200,triggerRule:{type:"speed_perfect"},isSecret:true},
    {code:"ultimate_scholar",name:"Ultimate Scholar",description:"Complete all units + 30d streak",category:"challenge" as const,xpReward:1000,triggerRule:{type:"ultimate"},isSecret:true},
  ]
  for (const a of achievements) {
    await prisma.achievement.upsert({ where: { code: a.code }, update: {}, create: { ...a, isActive: true, isSecret: (a as any).isSecret ?? false } })
  }
  console.log("✅ Seed complete!")
  console.log("\nDemo accounts:")
  console.log("  Admin:   admin@readmaster.app   / Admin123!")
  console.log("  Teacher: teacher@readmaster.app / Teacher123!")
  console.log("  Student: student@readmaster.app / Student123!")
  console.log("  Class code: DEMO2025")
}
main().catch((e)=>{ console.error(e); process.exit(1) }).finally(()=>prisma.$disconnect())
