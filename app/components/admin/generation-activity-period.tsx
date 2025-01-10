export default function GenerationActivityPeriod({
  startDate,
  endDate,
  className,
}: {
  startDate: string
  endDate: string | null | undefined
  className?: string
}) {
  return (
    <div className={className ? className : 'flex items-center gap-2 text-sm'}>
      <div>
        {new Intl.DateTimeFormat('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date(startDate))}
      </div>
      <div>-</div>
      <div>
        {endDate
          ? new Intl.DateTimeFormat('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }).format(new Date(endDate))
          : ''}
      </div>
    </div>
  )
}
