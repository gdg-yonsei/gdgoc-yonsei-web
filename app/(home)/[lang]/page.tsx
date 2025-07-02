import GDGLogo from '@/app/components/svg/gdg-logo'
import ShowMoreContent from '@/app/components/show-more-content'
import Friends from '@/app/components/svg/friends'
import FriendsTree from '@/app/components/svg/friends-tree'
import HomePageBackground from '@/app/(home)/[lang]/home-page-background'
import PopUpDiv from '@/app/components/pop-up-div'
import OpacityDiv from '@/app/components/opacity-div'

export default function HomePage() {
  return (
    <div className={'flex w-full flex-col overflow-x-hidden'}>
      {/*Welcome page*/}
      <div
        className={
          'relative flex h-screen w-screen items-center justify-center overflow-hidden p-8 pt-16'
        }
      >
        <HomePageBackground />
        <div className={'flex items-center gap-4'}>
          <GDGLogo svgKey={'main'} className={'w-52 md:w-64'} />
          <h1 className={'flex flex-col gap-4'}>
            <p className={'text-2xl md:text-4xl'}>Welcome to</p>
            <div
              className={
                'flex flex-col gap-3 text-4xl font-semibold md:text-6xl lg:flex-row'
              }
            >
              <p>Google</p>
              <p>Developer</p>
              <p>Group</p>
            </div>
            <p className={'text-logo-blue text-2xl md:text-4xl'}>
              Yonsei University
            </p>
          </h1>
        </div>
      </div>
      {/*About GDG Page*/}
      <div
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
              GDG (Google Developer Groups) on Campus is a community of
              university student developers interested in Google technologies.
              Students in GDG engage in the process of &#34;Connect - Learn -
              Grow,&#34; where they develop various skills such as development
              and leadership in a peer-to-peer learning environment, with the
              goal of building solutions for their communities and society.
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
              <p className={'text-logo-blue text-xl md:text-2xl'}>
                Yonsei University
              </p>
            </h2>
          </div>
          <div className={'grid grid-cols-1 gap-4 md:grid-cols-3'}>
            <OpacityDiv
              transition={{
                delay: 0.3,
              }}
              className={'ring-gdg-red-300 rounded-lg bg-white p-4 ring-2'}
            >
              <h3 className={'text-xl font-semibold'}>Community</h3>
              <p>
                A student developer group at Yonsei University that fosters
                collaboration and shares knowledge about the development
                ecosystem.
              </p>
            </OpacityDiv>
            <OpacityDiv
              transition={{
                delay: 0.6,
              }}
              className={'ring-gdg-green-300 rounded-lg bg-white p-4 ring-2'}
            >
              <h3 className={'text-xl font-semibold'}>Tech</h3>
              <p>
                Focused on using technology to address real-world community
                issues and drive positive social change.
              </p>
            </OpacityDiv>
            <OpacityDiv
              transition={{
                delay: 0.9,
              }}
              className={'ring-gdg-blue-300 rounded-lg bg-white p-4 ring-2'}
            >
              <h3 className={'text-xl font-semibold'}>Sustainable Growth</h3>
              <p>
                Aims to nurture developers into professionals who contribute to
                a sustainable society through IT-based solutions.
              </p>
            </OpacityDiv>
          </div>
        </div>
      </div>

      {/*Activities Page*/}
      <div
        className={
          'flex min-h-screen w-full flex-col items-center justify-center p-4 md:flex-row md:gap-8 md:py-24'
        }
      >
        <div>
          <h2 className={'text-4xl font-bold'}>Activities</h2>
        </div>
      </div>
      {/*Part Page*/}
      <div
        className={
          'flex min-h-screen w-full flex-col items-center justify-center p-4 md:flex-row md:py-24'
        }
      >
        <div
          className={
            'flex w-full max-w-xl flex-col items-center justify-center md:items-start'
          }
        >
          <div
            className={
              'flex flex-col gap-4 p-8 md:flex-row md:items-end md:px-0'
            }
          >
            <h2 className={'mx-auto text-3xl font-bold md:mx-0 md:text-4xl'}>
              Parts
            </h2>
            {/*<div*/}
            {/*  className={*/}
            {/*    'flex items-center gap-1 text-blue-500 not-md:hidden pb-[1px] hover:underline'*/}
            {/*  }*/}
            {/*>*/}
            {/*  <Link href={'/members'}>See All</Link>*/}
            {/*  <ChevronRightIcon className={'size-5'} />*/}
            {/*</div>*/}
            <Friends className={'mx-auto w-60 md:hidden'} />
          </div>
          <div className={'flex w-full flex-col gap-10'}>
            <div className={'home-about-box border-blue-500 md:border-0'}>
              <h3 className={'py-3 text-2xl font-semibold md:text-3xl'}>
                Organizer
              </h3>
              <ShowMoreContent>
                The Lead oversees all operations of GDG Yonsei. They are
                responsible for recruitment, event management, and overall
                planning.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box border-green-600 md:border-0'}>
              <h3 className={'py-3 text-2xl font-semibold md:text-3xl'}>
                FrontEnd (Web&Mobile)
              </h3>
              <ShowMoreContent>
                Aims to design user-friendly pages by leveraging various web
                technologies and developing web applications that align with the
                latest tech trends. The focus is on building efficient web
                structures to optimize the user experience while adhering to
                sustainable development practices. <br />
                Develop scalable mobile applications to ensure the product can
                be used in various environments. The mobile team discusses and
                explores sustainable application development.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box border-yellow-500 md:border-0'}>
              <h3 className={'py-3 text-2xl font-semibold md:text-3xl'}>
                BackEnd
              </h3>
              <ShowMoreContent>
                Responsible for server and infrastructure development. Members
                give presentations and engage in open discussions on topics of
                interest, ranging from server domain design (such as DDD, MSA,
                JPA) to infrastructure during team sessions.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box border-red-500 md:border-0'}>
              <h3 className={'py-3 text-2xl font-semibold md:text-3xl'}>
                ML/AI
              </h3>
              <ShowMoreContent>
                Focus on understanding and applying machine learning and
                artificial intelligence models. In weekly team sessions, members
                explore and present AI topics of interest, followed by open
                discussions.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box border-blue-500 md:border-0'}>
              <h3 className={'py-3 text-2xl font-semibold md:text-3xl'}>
                Cloud
              </h3>
              <ShowMoreContent>
                The newly established Cloud team this term focuses on learning
                cloud technologies for service deployment and applying them to
                real projects. They utilize various cloud technologies to
                efficiently deploy and manage multiple services.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box border-green-600 md:border-0'}>
              <h3 className={'py-3 text-2xl font-semibold md:text-3xl'}>
                UI/UX
              </h3>
              <ShowMoreContent>
                The UI/UX team works on improving service structures to enhance
                user experience. They collaborate with the Front-End team to
                research various methods for improving user experience and apply
                them to real projects.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box border-red-500 md:border-0'}>
              <h3 className={'py-3 text-2xl font-semibold md:text-3xl'}>
                DevRel (Developer Relations)
              </h3>
              <ShowMoreContent>
                Responsible for planning and managing overall community
                activities, including publishing weekly insights that summarize
                industry analysis and internal events. Devrel connects the
                internal and external community, supports the organization of
                inter-school joint events and exchange sessions, expert
                consultations, and plans industry-academia collaboration
                projects, while working to build a sustainable community
                culture.
              </ShowMoreContent>
            </div>
          </div>
        </div>
        <FriendsTree className={'size-[36rem] not-md:hidden'} />
      </div>
    </div>
  )
}
