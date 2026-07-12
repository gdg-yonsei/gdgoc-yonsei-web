const aboutPageContents = {
  hero: {
    lines: {
      en: [
        'We connect students,',
        'learn out loud,',
        'and grow into builders.',
      ],
      ko: ['학생들을 연결하고,', '함께 배우며,', '만드는 사람으로 성장합니다.'],
    },
    sub: {
      en: 'GDG on Campus Yonsei — a Google-backed developer community at Yonsei University.',
      ko: 'GDG on Campus Yonsei — 연세대학교의 구글 기반 개발자 커뮤니티입니다.',
    },
  },
  story: [
    {
      key: 'connect',
      order: '01',
      title: 'Connect',
      body: {
        en: 'We bring together students across majors who care about technology — through weekly gatherings, part communities, and events with other chapters.',
        ko: '전공을 넘어 기술을 좋아하는 학생들을 모읍니다 — 매주 열리는 모임, 파트 커뮤니티, 타 챕터와의 교류 행사로 연결됩니다.',
      },
    },
    {
      key: 'learn',
      order: '02',
      title: 'Learn',
      body: {
        en: 'Every member is both a learner and a teacher. T19 talks, part sessions, and study groups turn individual knowledge into shared knowledge.',
        ko: '모든 멤버는 배우는 사람이자 가르치는 사람입니다. T19 발표, 파트 세션, 스터디로 개인의 지식을 모두의 지식으로 만듭니다.',
      },
    },
    {
      key: 'grow',
      order: '03',
      title: 'Grow',
      body: {
        en: 'From hackathons to demo days, we ship real products for campus and society — and grow into developers who build solutions.',
        ko: '해커톤부터 데모데이까지, 캠퍼스와 사회를 위한 실제 결과물을 만들며 솔루션을 만드는 개발자로 성장합니다.',
      },
    },
  ],
  joinCta: {
    title: { en: 'Build with us', ko: '함께 만들어요' },
    body: {
      en: 'Recruiting opens at the start of each semester. Come build with us.',
      ko: '리크루팅은 매 학기 초에 열립니다. 함께 만들어갈 멤버를 기다립니다.',
    },
    button: { en: 'Go to Recruit', ko: '리크루팅 안내' },
  },
} as const

export default aboutPageContents
