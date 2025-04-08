import {
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import GDGLogo from '@/app/components/svg/gdg-logo'
import ShowMoreContent from '@/app/components/show-more-content'
import BookSVG from '@/app/components/book-svg'
import Trophy from '@/app/components/svg/trophy'
import Friends from '@/app/components/svg/friends'
import Link from 'next/link'
import FriendsTree from '@/app/components/svg/friends-tree'

export default function HomePage() {
  return (
    <div className={'w-full flex flex-col'}>
      {/*Welcome page*/}
      <div className={'w-full flex items-center justify-center h-screen pt-16'}>
        <div
          className={
            'flex flex-col items-center justify-center w-full max-w-xl'
          }
        >
          <GDGLogo className={'h-52 w-72'} svgKey={'homePage'} />
          <h1 className={'text-2xl font-semibold text-center md:hidden'}>
            Google Developer Group
            <br /> on Campus Yonsei
          </h1>
          <div
            className={
              'w-full p-2 px-3 rounded-full border-2 border-neutral-400 flex gap-2 items-center not-md:hidden'
            }
          >
            <MagnifyingGlassIcon className={'size-8 text-neutral-400'} />
            <p className={'text-xl font-semibold text-neutral-700'}>
              Who are we?
            </p>
          </div>
          <div
            className={'mt-24 flex flex-col items-center justify-center gap-2'}
          >
            <p className={'text-xl font-semibold not-md:hidden'}>Scroll Down</p>
            <ChevronDownIcon className={'size-12 animate-bounce'} />
          </div>
        </div>
      </div>
      {/*About GDG Page*/}
      <div
        className={
          'w-full p-4 flex flex-col items-center justify-center min-h-screen pt-16 md:flex-row md:gap-12 md:py-24'
        }
      >
        <GDGLogo className={' w-96 not-md:hidden'} svgKey={'homePage'} />
        <div
          className={
            'w-full max-w-xl flex flex-col items-center md:items-start'
          }
        >
          <h1
            className={
              'p-8 text-3xl font-bold mx-auto md:mx-0 md:p-0 md:pb-8 md:text-4xl'
            }
          >
            About GDG
          </h1>
          <div className={'w-full flex flex-col gap-10 md:gap-2'}>
            <div className={'home-about-box ring-blue-500 md:ring-0'}>
              <h3>
                <strong>GDG (Google Developer Groups)</strong> on Campus is a
                community of university student developers interested in Google
                technologies.
              </h3>
              <ShowMoreContent>
                Students in GDG engage in the process of &#34;Connect - Learn -
                Grow,&#34; where they develop various skills such as development
                and leadership in a peer-to-peer learning environment, with the
                goal of building solutions for their communities and society.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box ring-green-600 md:ring-0'}>
              <h3>
                <strong>GDG Yonsei University</strong> is a student developer
                community based at Yonsei University that shares the development
                ecosystem.
              </h3>
              <ShowMoreContent>
                It is a group of developers who not only share development
                knowledge but also aim to achieve social innovation through
                technology. GDG Yonsei University seeks to build solutions that
                address real community issues using development knowledge, with
                the goal of growing into professionals who contribute to a
                sustainable society through IT-driven social innovation.
              </ShowMoreContent>
            </div>
          </div>
        </div>
      </div>

      {/*Session Page*/}
      <div
        className={
          'w-full min-h-screen flex flex-col p-4 md:flex-row justify-center items-center md:gap-8 md:py-24'
        }
      >
        <div
          className={
            'flex flex-col items-center justify-center w-full max-w-xl md:items-start'
          }
        >
          <div
            className={
              'flex flex-col p-8 md:px-0 md:flex-row md:items-end md:gap-2'
            }
          >
            <h2 className={'text-3xl font-bold mx-auto md:mx-0 md:text-4xl'}>
              Sessions
            </h2>
            <div
              className={
                'flex items-center gap-1 text-blue-500 not-md:hidden pb-[1px] hover:underline'
              }
            >
              <Link href={'/sessions'}>See All</Link>
              <ChevronRightIcon className={'size-5'} />
            </div>
            <BookSVG className={'mx-auto size-60 md:hidden'} />
          </div>
          <div className={'w-full flex flex-col gap-10'}>
            <div className={'home-about-box ring-blue-500 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>T19</h3>
              <ShowMoreContent>
                T19, short for &#34;Tech at 19:00,&#34; is an internal
                tech-sharing conference held every Tuesday at 7 PM, with
                participation from all GDG Yonsei members. Each week, 3
                presenters share their technical knowledge or experiences.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box ring-green-600 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                GDG fopen()
              </h3>
              <ShowMoreContent>
                fopen() is a public tech seminar hosted by GDG Yonsei for
                student developers. It features in-depth tech topics from T19
                sessions or presentations by industry professionals currently
                working in the field. These seminars are open to students
                outside the community to encourage deeper technical discussions.
                By engaging with student developers beyond GDG on Campus, GDG
                Yonsei actively expands its community and fosters a leading
                developer culture at Yonsei University.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box ring-blue-500 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                Part Study Jam
              </h3>
              <ShowMoreContent>
                GDG Yonsei is divided into six specialized
                departments—Front-End, Back-End, Mobile, ML/AI, Design, and
                Developer Relations—each consisting of a small, select group.
                These departments conduct studies and workshops to develop
                advanced technical skills.
              </ShowMoreContent>
            </div>
          </div>
        </div>
        <BookSVG className={'w-96 h-80 not-md:hidden'} />
      </div>

      {/*Activities Page*/}
      <div
        className={
          'w-full min-h-screen flex flex-col p-4 md:flex-row items-center justify-center md:gap-8 md:py-24'
        }
      >
        <Trophy className={'h-96 w-96 not-md:hidden'} />
        <div
          className={
            'flex flex-col w-full max-w-xl items-center justify-center md:items-start'
          }
        >
          <div className={'flex flex-col p-8 gap-4 md:px-0 md:items-start'}>
            <h2 className={'text-3xl font-bold mx-auto md:text-4xl md:mx-0'}>
              Activities
            </h2>
            <Trophy className={'mx-auto size-60 md:hidden'} />
          </div>
          <div className={'w-full flex flex-col gap-10'}>
            <div className={'home-about-box ring-blue-500 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                Solution Challenge
              </h3>
              <ShowMoreContent>
                We participated in the 2023 Solution Challenge, an annual
                international student development competition organized by
                Google for Developers. We designed and built a product aimed at
                contributing to the achievement of the UN&#39;s Sustainable
                Development Goals (SDGs). <br />
                GDG Yonsei achieved the highest award rate among university
                chapters in South Korea. - 2,100 teams participated from
                university GDGs worldwide - Six teams from GDG Yonsei
                participated - Three teams making it to the Top 100 - One team
                being selected as a Top 10 Finalist This achievement highlights
                our group&#39;s strong technical capabilities and social impact.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box ring-red-500 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                GDG x Elice Programming Contest
              </h3>
              <ShowMoreContent>
                We organized a programming competition on the coding education
                platform Elice in collaboration with six other GDGs. Our team
                was responsible for creating and reviewing the problems
                following the coding test format, as well as planning and
                managing the event.
              </ShowMoreContent>
              {/*<Link*/}
              {/*  href={'https://festa.io/events/cc5EgVt52K2NyMCF6do8BQ'}*/}
              {/*  target={'_blank'}*/}
              {/*  className={*/}
              {/*    'text-blue-500 flex items-center gap-1 hover:underline pt-2 not-md:hidden'*/}
              {/*  }*/}
              {/*>*/}
              {/*  <p>Event Page</p>*/}
              {/*  <ChevronRightIcon className={'size-5'} />*/}
              {/*</Link>*/}
            </div>
            <div className={'home-about-box ring-yellow-500 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                Google I/O Extended Seoul 2023
              </h3>
              <ShowMoreContent>
                A joint conference was hosted by GDG Seoul, GDG Cloud Korea, and
                four GDG on Campus chapters. The conference featured three
                tracks and 15 sessions, covering not only key highlights from
                Google I/O 2023 but also the latest trends and practical
                experiences with Google technologies like Google Cloud,
                TensorFlow, Android, Flutter, and Go.
              </ShowMoreContent>
              {/*<Link*/}
              {/*  href={'https://festa.io/events/3683'}*/}
              {/*  target={'_blank'}*/}
              {/*  className={*/}
              {/*    'text-blue-500 flex items-center gap-1 hover:underline pt-2 not-md:hidden'*/}
              {/*  }*/}
              {/*>*/}
              {/*  <p>Event Page</p>*/}
              {/*  <ChevronRightIcon className={'size-5'} />*/}
              {/*</Link>*/}
            </div>
            <div className={'home-about-box ring-green-600 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                GDG Cloud Devfest
              </h3>
              <ShowMoreContent>
                A joint conference organized by three communities: GDG Cloud
                Korea, GDSC Yonsei University, and GDSC Ewha. The event featured
                industry professionals as speakers and focused on development
                topics related to Google Cloud.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box ring-blue-500 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                Namu-thon
              </h3>
              <ShowMoreContent>
                Hackathon co-hosted by the GDG communities of Yonsei, Hanyang,
                Sungkyunkwan, and Seoul Women’s University, with support from
                GDG Korea. A total of 150 participants from 36 GDG Korea
                chapters took part in the event.
                <br />
                Under the slogan &#34;From Forest to Trees,&#34; the hackathon
                emphasized the importance of focusing on both the big picture
                (the &#34;forest&#34;) and the finer details (the &#34;trees”:
                ‘Namu’ in Korean) in the developer&#39;s world. It provided
                participants with an opportunity to apply broad concepts learned
                in university to real-world scenarios.
              </ShowMoreContent>
            </div>
          </div>
        </div>
      </div>
      {/*Part Page*/}
      <div
        className={
          'w-full min-h-screen flex flex-col p-4 md:flex-row items-center justify-center md:py-24'
        }
      >
        <div
          className={
            'flex flex-col w-full max-w-xl items-center justify-center md:items-start'
          }
        >
          <div
            className={
              'flex flex-col p-8 gap-4 md:px-0 md:flex-row md:items-end'
            }
          >
            <h2 className={'text-3xl font-bold mx-auto md:text-4xl md:mx-0'}>
              Parts
            </h2>
            <div
              className={
                'flex items-center gap-1 text-blue-500 not-md:hidden pb-[1px] hover:underline'
              }
            >
              <Link href={'/members'}>See All</Link>
              <ChevronRightIcon className={'size-5'} />
            </div>
            <Friends className={'mx-auto w-60 md:hidden'} />
          </div>
          <div className={'w-full flex flex-col gap-10'}>
            <div className={'home-about-box ring-blue-500 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                Organizer
              </h3>
              <ShowMoreContent>
                The Lead oversees all operations of GDG Yonsei. They are
                responsible for recruitment, event management, and overall
                planning.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box ring-green-600 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                FrontEnd
              </h3>
              <ShowMoreContent>
                Aims to design user-friendly pages by leveraging various web
                technologies and developing web applications that align with the
                latest tech trends. The focus is on building efficient web
                structures to optimize the user experience while adhering to
                sustainable development practices.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box ring-yellow-500 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                BackEnd
              </h3>
              <ShowMoreContent>
                Responsible for server and infrastructure development. Members
                give presentations and engage in open discussions on topics of
                interest, ranging from server domain design (such as DDD, MSA,
                JPA) to infrastructure during team sessions.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box ring-red-500 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                Mobile
              </h3>
              <ShowMoreContent>
                Develop scalable mobile applications to ensure the product can
                be used in various environments. The mobile team discusses and
                explores sustainable application development.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box ring-blue-500 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                ML/AI
              </h3>
              <ShowMoreContent>
                Focus on understanding and applying machine learning and
                artificial intelligence models. In weekly team sessions, members
                explore and present AI topics of interest, followed by open
                discussions.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box ring-green-600 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                Design
              </h3>
              <ShowMoreContent>
                Responsible for all design aspects in GDG&#39;s events and
                projects. Members meet weekly to work on projects. We work on
                projects following a Google design/brand guide, with a focus on
                user experience, supported by user interviews. When no project
                is active, they learn together and discuss about design
                methodologies.
              </ShowMoreContent>
            </div>
            <div className={'home-about-box ring-red-500 md:ring-0'}>
              <h3 className={'text-2xl font-semibold py-3 md:text-3xl'}>
                Devrel (Developer Relations)
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
