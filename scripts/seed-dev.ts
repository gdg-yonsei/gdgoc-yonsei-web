import 'dotenv/config'
import { eq, inArray, like } from 'drizzle-orm'
import db from '../db'
import { generations } from '../db/schema/generations'
import { parts } from '../db/schema/parts'
import { projects } from '../db/schema/projects'
import { projectsToTags } from '../db/schema/projects-to-tags'
import { sessions } from '../db/schema/sessions'
import { tags } from '../db/schema/tags'
import { users } from '../db/schema/users'
import { usersToParts } from '../db/schema/users-to-parts'
import { usersToProjects } from '../db/schema/users-to-projects'
import { userToSession } from '../db/schema/user-to-session'
import { buildSessionPlans } from './seed/helpers'

const SEED_PREFIX = 'dev-seed-'
const SEED_GENERATION_NAME = '25-26'
const ALLOWED_DB_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'db', 'postgres']

const SEED_PARTS = [
  { name: 'Organizer', displayOrder: 1 },
  { name: 'Front-End', displayOrder: 2 },
  { name: 'Back-End', displayOrder: 3 },
  { name: 'ML/AI', displayOrder: 4 },
  { name: 'Cloud', displayOrder: 5 },
  { name: 'UI/UX', displayOrder: 6 },
  { name: 'DevRel', displayOrder: 7 },
]

const SEED_MEMBERS = [
  { first: 'Jimin', last: 'Kim', firstKo: '지민', lastKo: '김' },
  { first: 'Seoyeon', last: 'Lee', firstKo: '서연', lastKo: '이' },
  { first: 'Doyun', last: 'Park', firstKo: '도윤', lastKo: '박' },
  { first: 'Haeun', last: 'Choi', firstKo: '하은', lastKo: '최' },
  { first: 'Jiho', last: 'Jung', firstKo: '지호', lastKo: '정' },
  { first: 'Yuna', last: 'Kang', firstKo: '유나', lastKo: '강' },
  { first: 'Minjun', last: 'Cho', firstKo: '민준', lastKo: '조' },
  { first: 'Chaewon', last: 'Yoon', firstKo: '채원', lastKo: '윤' },
  { first: 'Sunwoo', last: 'Jang', firstKo: '선우', lastKo: '장' },
  { first: 'Ari', last: 'Lim', firstKo: '아리', lastKo: '임' },
  { first: 'Taeyang', last: 'Han', firstKo: '태양', lastKo: '한' },
  { first: 'Sia', last: 'Oh', firstKo: '시아', lastKo: '오' },
  { first: 'Juwon', last: 'Seo', firstKo: '주원', lastKo: '서' },
  { first: 'Nayun', last: 'Kwon', firstKo: '나윤', lastKo: '권' },
  { first: 'Ian', last: 'Hwang', firstKo: '이안', lastKo: '황' },
  { first: 'Dana', last: 'Song', firstKo: '다나', lastKo: '송' },
]

const SEED_TAGS = [
  'Next.js',
  'TypeScript',
  'Flutter',
  'FastAPI',
  'PyTorch',
  'Firebase',
  'Kotlin',
  'Go',
  'Terraform',
  'Figma',
]

const SEED_PROJECTS = [
  { name: 'Campus Compass', nameKo: '캠퍼스 나침반', description: 'Indoor navigation for Yonsei campus buildings.', descriptionKo: '연세 캠퍼스 실내 길찾기 서비스.', tags: ['Flutter', 'Firebase'], repoUrl: 'https://github.com/gdg-yonsei/campus-compass', demoUrl: 'https://campus-compass.example.com' },
  { name: 'Lecture Lens', nameKo: '렉처 렌즈', description: 'AI-powered lecture summarization and search.', descriptionKo: 'AI 강의 요약·검색 도구.', tags: ['PyTorch', 'FastAPI'], repoUrl: 'https://github.com/gdg-yonsei/lecture-lens', demoUrl: null },
  { name: 'Green Route', nameKo: '그린 루트', description: 'Carbon-aware commute planner for students.', descriptionKo: '탄소 배출을 고려한 통학 경로 추천.', tags: ['Next.js', 'TypeScript'], repoUrl: 'https://github.com/gdg-yonsei/green-route', demoUrl: 'https://green-route.example.com' },
  { name: 'Mokdori', nameKo: '먹도리', description: 'Campus restaurant queue and review service.', descriptionKo: '학식·맛집 대기열과 리뷰 서비스.', tags: ['Kotlin', 'Firebase'], repoUrl: null, demoUrl: 'https://mokdori.example.com' },
  { name: 'Cloud Atlas', nameKo: '클라우드 아틀라스', description: 'Terraform templates for student projects.', descriptionKo: '학생 프로젝트용 Terraform 템플릿 모음.', tags: ['Terraform', 'Go'], repoUrl: 'https://github.com/gdg-yonsei/cloud-atlas', demoUrl: null },
  { name: 'Study Sync', nameKo: '스터디 싱크', description: 'Real-time study group matching platform.', descriptionKo: '실시간 스터디 그룹 매칭 플랫폼.', tags: ['Next.js', 'Firebase'], repoUrl: 'https://github.com/gdg-yonsei/study-sync', demoUrl: 'https://study-sync.example.com' },
  { name: 'Sign Bridge', nameKo: '사인 브릿지', description: 'Sign language translation with on-device ML.', descriptionKo: '온디바이스 ML 수어 번역.', tags: ['PyTorch', 'Flutter'], repoUrl: 'https://github.com/gdg-yonsei/sign-bridge', demoUrl: null },
  { name: 'Portfolio Kit', nameKo: '포트폴리오 킷', description: 'Design-system-driven portfolio builder.', descriptionKo: '디자인 시스템 기반 포트폴리오 빌더.', tags: ['Figma', 'TypeScript'], repoUrl: 'https://github.com/gdg-yonsei/portfolio-kit', demoUrl: 'https://portfolio-kit.example.com' },
]

function assertLocalDatabase() {
  const rawUrl = process.env.AUTH_DRIZZLE_URL
  if (!rawUrl) {
    console.error('AUTH_DRIZZLE_URL is not set.')
    process.exit(1)
  }
  const hostname = new URL(rawUrl).hostname
  if (
    !ALLOWED_DB_HOSTS.includes(hostname) &&
    !process.argv.includes('--force')
  ) {
    console.error(
      `Refusing to seed non-local database host "${hostname}". Pass --force to override.`
    )
    process.exit(1)
  }
}

/** 이전 시드 데이터만 마커 기반으로 제거 (TRUNCATE 금지) */
async function cleanupPreviousSeed() {
  await db.delete(sessions).where(like(sessions.authorId, `${SEED_PREFIX}%`))
  await db.delete(projects).where(like(projects.authorId, `${SEED_PREFIX}%`))

  const generation = await db.query.generations.findFirst({
    where: eq(generations.name, SEED_GENERATION_NAME),
  })
  if (generation) {
    await db.delete(parts).where(eq(parts.generationsId, generation.id))
    await db.delete(generations).where(eq(generations.id, generation.id))
  }

  await db.delete(users).where(like(users.id, `${SEED_PREFIX}%`))
  // tags는 실데이터와 공유될 수 있으므로 삭제하지 않고 onConflictDoNothing으로 upsert한다.
}

async function main() {
  assertLocalDatabase()
  await cleanupPreviousSeed()

  const generation = (
    await db
      .insert(generations)
      .values({
        name: SEED_GENERATION_NAME,
        startDate: '2025-09-01',
        endDate: '2026-08-31',
      })
      .returning({ id: generations.id, name: generations.name })
  )[0]!

  const insertedParts = await db
    .insert(parts)
    .values(
      SEED_PARTS.map((part) => ({
        name: part.name,
        description: `${part.name} part`,
        generationsId: generation.id,
        displayOrder: part.displayOrder,
      }))
    )
    .returning({ id: parts.id, name: parts.name })

  const organizerRow = {
    id: `${SEED_PREFIX}organizer`,
    name: 'dev-seed-organizer',
    email: `${SEED_PREFIX}organizer@example.com`,
    role: 'LEAD' as const,
    firstName: 'Hana',
    lastName: 'Yu',
    firstNameKo: '하나',
    lastNameKo: '유',
    isForeigner: false,
  }
  const memberRows = SEED_MEMBERS.map((member, index) => ({
    id: `${SEED_PREFIX}member-${String(index + 1).padStart(2, '0')}`,
    name: `${member.first} ${member.last}`,
    email: `${SEED_PREFIX}member-${index + 1}@example.com`,
    role: 'MEMBER' as const,
    firstName: member.first,
    lastName: member.last,
    firstNameKo: member.firstKo,
    lastNameKo: member.lastKo,
    isForeigner: false,
  }))
  await db.insert(users).values([organizerRow, ...memberRows])

  const organizerPartId = insertedParts.find(
    (part) => part.name === 'Organizer'
  )!.id
  const rotatingParts = insertedParts.filter(
    (part) => part.name !== 'Organizer'
  )
  await db.insert(usersToParts).values([
    {
      userId: organizerRow.id,
      partId: organizerPartId,
      userType: 'Core' as const,
    },
    ...memberRows.map((member, index) => ({
      userId: member.id,
      partId: rotatingParts[index % rotatingParts.length]!.id,
      userType: 'Primary' as const,
    })),
  ])

  const plans = buildSessionPlans()
  let partSessionCursor = 0
  const insertedSessions = await db
    .insert(sessions)
    .values(
      plans.map((plan) => ({
        name: plan.name,
        nameKo: plan.nameKo,
        description: `${plan.name} — a GDGoC Yonsei activity.`,
        descriptionKo: `${plan.nameKo} — GDGoC Yonsei 활동입니다.`,
        authorId: organizerRow.id,
        partId:
          plan.category === 'part_session'
            ? rotatingParts[partSessionCursor++ % rotatingParts.length]!.id
            : organizerPartId,
        internalOpen: true,
        publicOpen: false,
        maxCapacity: 40,
        location: plan.location,
        locationKo: plan.locationKo,
        type:
          plan.category === 'part_session'
            ? ('Part Session' as const)
            : ('General Session' as const),
        category: plan.category,
        displayOnWebsite: true,
        startAt: plan.startAt,
        endAt: plan.endAt,
      }))
    )
    .returning({ id: sessions.id })

  // 세션별 5~15명 결정적 참여 배정
  const attendanceRows = insertedSessions.flatMap((session, sessionIndex) => {
    const attendeeCount = 5 + ((sessionIndex * 7) % 11)
    return Array.from({ length: attendeeCount }, (_, offset) => ({
      userId: memberRows[(sessionIndex + offset) % memberRows.length]!.id,
      sessionId: session.id,
    }))
  })
  await db.insert(userToSession).values(attendanceRows)

  await db
    .insert(tags)
    .values(SEED_TAGS.map((name) => ({ name })))
    .onConflictDoNothing()
  const tagRows = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(inArray(tags.name, SEED_TAGS))
  const tagIdByName = new Map(tagRows.map((tag) => [tag.name, tag.id]))

  const insertedProjects = await db
    .insert(projects)
    .values(
      SEED_PROJECTS.map((project) => ({
        name: project.name,
        nameKo: project.nameKo,
        description: project.description,
        descriptionKo: project.descriptionKo,
        content: `# ${project.name}\n\n${project.description}`,
        contentKo: `# ${project.nameKo}\n\n${project.descriptionKo}`,
        authorId: organizerRow.id,
        generationId: generation.id,
        repoUrl: project.repoUrl,
        demoUrl: project.demoUrl,
      }))
    )
    .returning({ id: projects.id })

  await db.insert(projectsToTags).values(
    insertedProjects.flatMap((project, index) =>
      SEED_PROJECTS[index]!.tags.map((tagName) => ({
        projectId: project.id,
        tagId: tagIdByName.get(tagName)!,
      }))
    )
  )
  await db.insert(usersToProjects).values(
    insertedProjects.flatMap((project, index) =>
      [0, 1, 2].map((offset) => ({
        projectId: project.id,
        userId: memberRows[(index * 3 + offset) % memberRows.length]!.id,
      }))
    )
  )

  console.log(
    `Seeded: generation "${generation.name}", ${insertedParts.length} parts, ${
      memberRows.length + 1
    } users, ${insertedSessions.length} sessions, ${attendanceRows.length} attendances, ${insertedProjects.length} projects.`
  )
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
