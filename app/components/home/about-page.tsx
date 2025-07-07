import PopUpDiv from '@/app/components/pop-up-div'
import GDGLogo from '@/app/components/svg/gdg-logo'

export default function AboutPage() {
  return (
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
            GDG (Google Developer Groups) on Campus is a community of university
            student developers interested in Google technologies. Students in
            GDG engage in the process of &#34;Connect - Learn - Grow,&#34; where
            they develop various skills such as development and leadership in a
            peer-to-peer learning environment, with the goal of building
            solutions for their communities and society.
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
          <div className={'ring-gdg-red-300 rounded-lg bg-white p-4 ring-2'}>
            <h3 className={'text-xl font-semibold'}>Community</h3>
            <p>
              A student developer group at Yonsei University that fosters
              collaboration and shares knowledge about the development
              ecosystem.
            </p>
          </div>
          <div className={'ring-gdg-green-300 rounded-lg bg-white p-4 ring-2'}>
            <h3 className={'text-xl font-semibold'}>Tech</h3>
            <p>
              Focused on using technology to address real-world community issues
              and drive positive social change.
            </p>
          </div>
          <div className={'ring-gdg-blue-300 rounded-lg bg-white p-4 ring-2'}>
            <h3 className={'text-xl font-semibold'}>Sustainable Growth</h3>
            <p>
              Aims to nurture developers into professionals who contribute to a
              sustainable society through IT-based solutions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
