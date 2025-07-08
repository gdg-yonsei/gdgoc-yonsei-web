import PopUpDiv from '@/app/components/pop-up-div'
import GDGLogo from '@/app/components/svg/gdg-logo'

const contents = {
  gdg: {
    ko: 'GDG (Google Developer Groups) on Campus는 구글 기술에 관심 있는 대학생 개발자들로 이루어진 커뮤니티입니다. GDG에 참여하는 학생들은 동료 간의 학습 환경에서 개발 및 리더십 등 다양한 역량을 키우며, “Connect - Learn - Grow”의 과정을 통해 지역사회와 사회를 위한 해결책을 만드는 것을 목표로 활동합니다.',
    en: 'GDG (Google Developer Groups) on Campus is a community of university student developers interested in Google technologies. Students in GDG engage in the process of "Connect - Learn - Grow," where they develop various skills such as development and leadership in a peer-to-peer learning environment, with the goal of building solutions for their communities and society.',
  },
  gdgCommunity: {
    en: 'A student developer group at Yonsei University that fosters collaboration and shares knowledge about the development ecosystem.',
    ko: '연세대학교의 학생 개발자 그룹으로, 개발 생태계에 대한 지식을 공유하고 협업을 촉진하는 것을 목표로 합니다.',
  },
  gdgTech: {
    en: 'Focused on using technology to address real-world community issues and drive positive social change.',
    ko: '기술을 활용하여 현실 세계의 지역 사회 문제를 해결하고 긍정적인 사회 변화를 이끄는 데 집중합니다.',
  },
  gdgSustainableGrowth: {
    en: 'Aims to nurture developers into professionals who contribute to a sustainable society through IT-based solutions.',
    ko: 'IT 기반 솔루션을 통해 지속 가능한 사회에 기여하는 전문가로 개발자를 성장시키는 것을 목표로 합니다.',
  },
}

export default function AboutPage({ lang }: { lang: string }) {
  return (
    <section
      className={
        'flex min-h-screen w-full flex-col items-center justify-center bg-neutral-200 p-4 pt-16 md:gap-12 md:py-24'
      }
    >
      <div
        className={
          'flex w-full max-w-4xl flex-col-reverse items-center gap-4 md:flex-row'
        }
      >
        <PopUpDiv className={'flex w-full max-w-4xl flex-col gap-4 md:w-1/2'}>
          <h2 className={'text-2xl font-semibold md:text-4xl'}>
            Google Developer Group
          </h2>
          <p className={'rounded-lg bg-white p-4'}>
            {contents.gdg[lang as keyof typeof contents.gdg] ?? contents.gdg.en}
          </p>
        </PopUpDiv>
        <div className={'flex w-1/2 items-center justify-center'}>
          <GDGLogo className={'w-36 md:w-64'} />
        </div>
      </div>
      <div className={'flex w-full max-w-4xl flex-col gap-8 py-24'}>
        <div className={'flex items-center gap-4'}>
          <GDGLogo className={'w-24 md:w-36'} />
          <h2 className={'text-2xl font-semibold md:text-4xl'}>
            <p>Google Developer Group</p>
            <p className={'text-logo-blue text-xl font-light md:text-2xl'}>
              Yonsei University
            </p>
          </h2>
        </div>
        <div className={'grid grid-cols-1 gap-4 md:grid-cols-3'}>
          <div className={'ring-gdg-red-300 rounded-lg bg-white p-4 ring-2'}>
            <h3 className={'text-xl font-semibold'}>Community</h3>
            <p>
              {contents.gdgCommunity[
                lang as keyof typeof contents.gdgCommunity
              ] ?? contents.gdgCommunity.en}
            </p>
          </div>
          <div className={'ring-gdg-green-300 rounded-lg bg-white p-4 ring-2'}>
            <h3 className={'text-xl font-semibold'}>Tech</h3>
            <p>
              {contents.gdgTech[lang as keyof typeof contents.gdgTech] ??
                contents.gdgTech.en}
            </p>
          </div>
          <div className={'ring-gdg-blue-300 rounded-lg bg-white p-4 ring-2'}>
            <h3 className={'text-xl font-semibold'}>Sustainable Growth</h3>
            <p>
              {contents.gdgSustainableGrowth[
                lang as keyof typeof contents.gdgSustainableGrowth
              ] ?? contents.gdgSustainableGrowth.en}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
