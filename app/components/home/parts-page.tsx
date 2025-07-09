import { PartCard } from '@/app/components/home/part-card'

const partsData = [
  {
    title: 'Front-End',
    content: {
      en: 'Aims to design user-friendly pages by leveraging various web technologies and developing web applications that align with the latest tech trends. The focus is on building efficient web structures to optimize the user experience while adhering to sustainable development practices.',
      ko: '다양한 웹 기술을 활용하여 최신 기술 트렌드에 부합하는 웹 애플리케이션을 개발하고, 사용자 친화적인 페이지를 설계하는 것을 목표로 합니다. 효율적인 웹 구조를 구축하여 사용자 경험을 최적화하고, 지속 가능한 개발 방식을 준수하는 데 중점을 둡니다.',
    },
  },
  {
    title: 'Back-End',
    content: {
      en: 'Responsible for server and infrastructure development. Members give presentations and engage in open discussions on topics of interest, ranging from server domain design (such as DDD, MSA, JPA) to infrastructure during team session.',
      ko: '서버 및 인프라 개발을 담당합니다. 팀 세션에서는 DDD, MSA, JPA와 같은 서버 도메인 설계부터 인프라에 이르기까지 다양한 주제를 발표하고 자유롭게 토론합니다.',
    },
  },
  {
    title: 'ML/AI',
    content: {
      en: 'Focus on understanding and applying machine learning and artificial intelligence models. In weekly team session, members explore and present AI topics of interest, followed by open discussions.',
      ko: '머신러닝과 인공지능 모델을 이해하고 적용하는 데 중점을 둡니다. 매주 팀 세션에서는 구성원들이 관심 있는 AI 주제를 탐구하고 발표한 뒤, 자유로운 토론을 진행합니다.',
    },
  },
  {
    title: 'Cloud',
    content: {
      en: 'The newly established Cloud team this term focuses on learning cloud technologies for service deployment and applying them to real projects. They utilize various cloud technologies to efficiently deploy and manage multiple services.',
      ko: '이번 기수에 새롭게 신설된 Cloud 팀은 서비스 배포를 위한 클라우드 기술 학습과 이를 실제 프로젝트에 적용하는 데 집중합니다. 다양한 클라우드 기술을 활용하여 여러 서비스를 효율적으로 배포하고 관리합니다.',
    },
  },
  {
    title: 'UI/UX',
    content: {
      en: 'The UI/UX team works on improving service structures to enhance user experience. They collaborate with the Front-End team to research various methods for improving user experience and apply them to real projects.',
      ko: 'UI/UX 팀은 사용자 경험을 향상시키기 위해 서비스 구조를 개선하는 작업을 수행합니다. 프론트엔드 팀과 협력하여 다양한 사용자 경험 개선 방법을 연구하고 이를 실제 프로젝트에 적용합니다.',
    },
  },
  {
    title: 'DevRel',
    content: {
      en: 'DevRel plans and manages community activities, publishes weekly insights on industry and internal events, connects internal and external communities, supports joint events and expert consultations, and fosters a sustainable community culture through industry-academia collaboration.',
      ko: 'DevRel은 커뮤니티 활동을 기획하고 관리하며, 산업 동향과 내부 소식을 담은 주간 인사이트를 발행합니다. 또한 내부와 외부 커뮤니티를 연결하고, 공동 행사 및 전문가 상담을 지원하며, 산학 협력을 통해 지속 가능한 커뮤니티 문화를 조성합니다.',
    },
  },
]

export default function PartsPage({ lang }: { lang: string }) {
  return (
    <section
      className={
        'bg-gdg-white flex min-h-screen w-full items-center justify-center'
      }
    >
      <div className={'w-full max-w-6xl p-4 py-12'}>
        <h2 className={'py-2 text-3xl font-semibold md:text-5xl'}>
          {lang === 'ko' ? '파트' : 'Parts'}
        </h2>
        <div
          className={
            'mx-auto grid w-full max-w-xs grid-cols-1 items-start gap-4 md:max-w-none md:grid-cols-3'
          }
        >
          {partsData.map((part, index) => (
            <PartCard
              key={index}
              title={part.title}
              content={
                part.content[lang as keyof typeof part.content] ??
                part.content.en
              }
            />
          ))}
        </div>
      </div>
    </section>
  )
}
