import { ChevronDownIcon } from '@heroicons/react/24/outline'
import GDGLogo from '@/app/components/gdg-logo'
import ShowMoreContent from '@/app/components/show-more-content'

export default function HomePage() {
  return (
    <div className={'w-full flex flex-col *:mt-16'}>
      {/*Welcome page*/}
      <div className={'w-full flex items-center justify-center h-home-screen'}>
        <div className={'flex flex-col items-center justify-center'}>
          <GDGLogo className={'h-52 w-72'} svgKey={'homePage'} />
          <h1 className={'text-2xl font-semibold text-center'}>
            Google Developer Group
            <br /> on Campus Yonsei
          </h1>
          <ChevronDownIcon className={'size-12 mt-24'} />
        </div>
      </div>
      {/*About GDG Page*/}
      <div
        className={
          'w-full p-4 flex flex-col items-center justify-center min-h-screen'
        }
      >
        <h2 className={'p-8 text-3xl font-bold mx-auto'}>About GDG</h2>
        <div className={'w-full flex flex-col gap-10'}>
          <div className={'home-about-box ring-blue-500'}>
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
          <div className={'home-about-box ring-green-600'}>
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
  )
}
