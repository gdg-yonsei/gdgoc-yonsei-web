import { motion } from 'motion/react'
import { Locale } from '@/i18n-config'
import { getLocalizedText } from '../utils'
import { GoogleDots, ColorBar } from '../decorative'
import { stagger, fadeUp, scaleIn } from '../variants'

export default function RecruitmentDesignSlide({ lang }: { lang: Locale }) {
  const parts = [
    {
      name: 'Cloud',
      description: {
        ko: 'GCP 기반 클라우드 인프라 설계, 컨테이너 오케스트레이션, CI/CD 파이프라인 구축',
        en: 'GCP-based cloud infrastructure, container orchestration, and CI/CD pipeline development',
      },
      lookingFor: {
        ko: '클라우드 서비스(GCP/AWS), Docker, Kubernetes 등 인프라 기술에 대한 이해와 DevOps 경험',
        en: 'Understanding of cloud services (GCP/AWS), Docker, Kubernetes, and hands-on DevOps experience',
      },
      accent: 'bg-gdg-yellow-300',
      accentLight: 'bg-gdg-yellow-300/10',
      textAccent: 'text-gdg-yellow-300',
    },
    {
      name: 'UX / UI',
      description: {
        ko: '사용자 중심의 경험 설계, 인터페이스 디자인, 디자인 시스템 구축 및 프로토타이핑',
        en: 'User-centered experience design, interface design, design systems, and prototyping',
      },
      lookingFor: {
        ko: 'Figma 등 디자인 도구 활용 능력과 사용자 리서치 기반의 UX 설계 역량',
        en: 'Proficiency in design tools like Figma with user-research-driven UX design skills',
      },
      accent: 'bg-gdg-red-300',
      accentLight: 'bg-gdg-red-300/10',
      textAccent: 'text-gdg-red-300',
    },
    {
      name: 'DevRel',
      description: {
        ko: '개발자 커뮤니티 운영, 기술 콘텐츠 제작, 이벤트 기획 및 대외 협력',
        en: 'Developer community management, tech content creation, event planning, and partnerships',
      },
      lookingFor: {
        ko: '기술 커뮤니케이션 역량과 커뮤니티 빌딩에 대한 열정, 콘텐츠 기획 및 제작 능력',
        en: 'Strong tech communication skills, passion for community building, and content creation ability',
      },
      accent: 'bg-gdg-blue-300',
      accentLight: 'bg-gdg-blue-300/10',
      textAccent: 'text-gdg-blue-300',
    },
  ]

  return (
    <div className="bg-gdg-white relative flex min-h-full w-full items-center justify-center overflow-hidden py-16 md:py-8">
      <GoogleDots />

      <motion.div
        className="relative z-10 flex w-full max-w-6xl flex-col gap-3 px-5 md:gap-10 md:px-8"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp}>
          <p className="text-gdg-blue-300 mb-1 text-sm font-semibold tracking-widest uppercase md:text-base">
            We&apos;re looking for
          </p>
          <h2 className="text-3xl font-bold text-neutral-800 md:text-4xl lg:text-5xl">
            {getLocalizedText(lang, { ko: '모집 파트 소개', en: 'Our Teams' })}
          </h2>
          <ColorBar color="bg-gdg-blue-300" />
        </motion.div>

        <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-3 md:gap-5">
          {parts.map((p, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              className="relative overflow-hidden rounded-2xl bg-white p-3 shadow-sm md:p-6"
            >
              <div
                className={`absolute top-0 right-0 left-0 h-1 ${p.accent}`}
              />
              <div className="flex flex-col gap-3">
                <h3
                  className={`text-base font-bold ${p.textAccent} md:text-2xl`}
                >
                  {p.name}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 md:text-base">
                  {getLocalizedText(lang, p.description)}
                </p>
                <div className={`rounded-xl ${p.accentLight} p-2 md:p-3`}>
                  <p className="text-xs font-semibold text-neutral-500 md:text-sm">
                    Ideal Candidate
                  </p>
                  <p className="mt-1 text-sm leading-snug text-neutral-700 md:text-base">
                    {getLocalizedText(lang, p.lookingFor)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
