/** 직접 요청한 없는 기수·상세 경로는 proxy가 404를 반환해, 이 경계는 주로 클라이언트 이동 중 보인다.
 * 어떤 라우트와도 맞지 않는 URL은 `global-not-found.tsx`가 맡는다. */
import NotFoundView from '@/app/components/site/not-found-view'

export default function LocaleNotFound() {
  return (
    <div className="bg-stage text-on-stage">
      <NotFoundView />
    </div>
  )
}
