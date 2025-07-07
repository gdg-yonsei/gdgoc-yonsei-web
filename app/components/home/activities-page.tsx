import ActivitiesList from '@/app/components/home/activities-list'

export default function ActivitiesPage() {
  return (
    <section
      className={
        'flex min-h-screen w-full flex-col items-center justify-center p-4 md:gap-8 md:py-24'
      }
    >
      <div className={'flex w-full max-w-4xl flex-col items-center gap-4'}>
        <h2 className={'text-3xl font-bold md:text-5xl'}>Activities</h2>
      </div>
      <ActivitiesList />
    </section>
  )
}
