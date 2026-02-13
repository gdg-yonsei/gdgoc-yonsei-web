const stars = [
  {
    className: 'bg-gdg-red-300 top-96 -left-24 shooting-star shooting-star-tr',
    duration: '4s',
    delay: '0.5s',
  },
  {
    className: 'bg-gdg-red-300 -bottom-0 -left-24 shooting-star shooting-star-tr',
    duration: '3s',
    delay: '0s',
  },
  {
    className: 'bg-gdg-red-300 -bottom-24 -left-24 shooting-star shooting-star-tr',
    duration: '5s',
    delay: '2s',
  },
  {
    className: 'bg-gdg-blue-300 -right-24 bottom-0 shooting-star shooting-star-tl',
    duration: '3s',
    delay: '0.5s',
  },
  {
    className:
      'bg-gdg-blue-300 -right-24 bottom-48 shooting-star shooting-star-tl',
    duration: '6s',
    delay: '0s',
  },
  {
    className: 'bg-gdg-blue-300 top-96 -right-24 shooting-star shooting-star-tl',
    duration: '4s',
    delay: '1s',
  },
  {
    className: 'bg-gdg-green-300 top-0 -right-24 shooting-star shooting-star-bl',
    duration: '3s',
    delay: '1s',
  },
  {
    className: 'bg-gdg-green-300 top-48 -right-24 shooting-star shooting-star-bl',
    duration: '4s',
    delay: '2s',
  },
  {
    className:
      'bg-yellow-500 top-24 -left-24 shooting-star shooting-star-br',
    duration: '4s',
    delay: '0s',
  },
  {
    className:
      'bg-yellow-500 top-48 -left-24 shooting-star shooting-star-br',
    duration: '3s',
    delay: '2s',
  },
  {
    className:
      'bg-yellow-500 top-96 -left-24 shooting-star shooting-star-br',
    duration: '5s',
    delay: '1.5s',
  },
]

/**
 * 첫 화면 배경을 만드는 컴포넌트
 * @constructor
 */
export default function HomePageBackground() {
  return (
    <div className={'pointer-events-none absolute inset-0 -z-10 overflow-hidden'}>
      {stars.map((star, index) => (
        <div
          key={index}
          className={star.className}
          style={{
            animationDuration: star.duration,
            animationDelay: star.delay,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          }}
          aria-hidden
        />
      ))}
    </div>
  )
}
