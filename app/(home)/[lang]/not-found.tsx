/**
 * 공개 사이트 안의 404(서버 컴포넌트). 공개 페이지가 `notFound()`를 부르면 사이트 셸(헤더·푸터) 안에 그린다.
 *
 * 직접 요청한 없는 기수·상세 페이지는 proxy가 먼저 진짜 404 상태 코드로 돌려주므로, 이 화면은 주로
 * 클라이언트 내비게이션 중에 보인다. 어떤 경로와도 맞지 않는 URL은 `app/global-not-found.tsx`가 맡는다.
 */
import NotFoundView from '@/app/components/site/not-found-view'

/** 무대(stage) 면 위에 404 본문을 그린다. */
export default function LocaleNotFound() {
  return (
    <div className="bg-stage text-on-stage">
      <NotFoundView />
    </div>
  )
}
