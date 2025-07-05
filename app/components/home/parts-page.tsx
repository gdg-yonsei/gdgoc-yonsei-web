import { PartCard } from '@/app/components/home/part-card'

const partsData = [
  {
    title: 'Front-End',
    content:
      'Aims to design user-friendly pages by leveraging various web technologies and developing web applications that align with the latest tech trends. The focus is on building efficient web structures to optimize the user experience while adhering to sustainable development practices. Develop scalable mobile applications to ensure the product can be used in various environments. The mobile team discusses and explores sustainable application development.',
  },
  {
    title: 'Back-End',
    content:
      'Responsible for server and infrastructure development. Members give presentations and engage in open discussions on topics of interest, ranging from server domain design (such as DDD, MSA, JPA) to infrastructure during team sessions.',
  },
  {
    title: 'ML/AI',
    content:
      'Focus on understanding and applying machine learning and artificial intelligence models. In weekly team sessions, members explore and present AI topics of interest, followed by open discussions.',
  },
  {
    title: 'Cloud',
    content:
      'The newly established Cloud team this term focuses on learning cloud technologies for service deployment and applying them to real projects. They utilize various cloud technologies to efficiently deploy and manage multiple services.',
  },
  {
    title: 'UI/UX',
    content:
      'The UI/UX team works on improving service structures to enhance user experience. They collaborate with the Front-End team to research various methods for improving user experience and apply them to real projects.',
  },
  {
    title: 'DevRel',
    content:
      'Responsible for planning and managing overall community activities, including publishing weekly insights that summarize industry analysis and internal events. Devrel connects the internal and external community, supports the organization of inter-school joint events and exchange sessions, expert consultations, and plans industry-academia collaboration projects, while working to build a sustainable community culture.',
  },
]

export default function PartsPage() {
  return (
    <div
      className={
        'bg-gdg-white flex min-h-screen w-full items-center justify-center'
      }
    >
      <div className={'w-full max-w-4xl p-4 py-12'}>
        <h2 className={'py-2 text-3xl font-semibold md:text-5xl'}>Parts</h2>
        <div
          className={
            'mx-auto grid w-full max-w-xs grid-cols-1 gap-4 md:max-w-none md:grid-cols-2'
          }
        >
          {partsData.map((part, index) => (
            <PartCard key={index} title={part.title} content={part.content} />
          ))}
        </div>
      </div>
    </div>
  )
}
