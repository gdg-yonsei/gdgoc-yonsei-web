/**
 * Tailwind 클래스 병합 헬퍼 `cn()`.
 *
 * 관리자 화면 전용이다. tailwind-merge가 무거워(약 9KB gz) 공개 사이트 클라이언트 번들에는
 * 넣지 않는다(`tests/lib/site/client-bundle-guards.test.ts`가 검사한다).
 */
import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * `app/globals.css`에서 `@utility`로 등록한 관리자 프리미티브를 tailwind-merge에 알려 준다.
 * 이렇게 해야 같은 그룹의 클래스가 충돌할 때 나중 값이 이긴다.
 * (예: `cn('admin-btn-primary', 'admin-btn-danger')` → danger만 남음)
 */
type AdminClassGroupId =
  'admin-type' | 'admin-btn' | 'admin-badge' | 'admin-surface'

const twMerge = extendTailwindMerge<AdminClassGroupId>({
  extend: {
    classGroups: {
      'admin-type': [
        'type-heading-1',
        'type-heading-2',
        'type-heading-3',
        'type-title',
        'type-body',
        'type-body-sm',
        'type-caption',
        'type-eyebrow',
      ],
      'admin-btn': [
        'admin-btn',
        'admin-btn-primary',
        'admin-btn-secondary',
        'admin-btn-ghost',
        'admin-btn-danger',
      ],
      'admin-badge': [
        'admin-badge',
        'admin-badge-neutral',
        'admin-badge-primary',
        'admin-badge-success',
        'admin-badge-warning',
        'admin-badge-danger',
      ],
      'admin-surface': ['admin-card', 'admin-panel'],
    },
    conflictingClassGroups: {
      // 타이포 유틸리티는 font-size/weight/line-height를 함께 설정하므로
      // 개별 Tailwind 유틸리티가 뒤에 오면 그쪽이 이겨야 한다.
      'admin-type': ['font-size', 'font-weight', 'leading', 'tracking'],
    },
  },
})

/**
 * 조건부 클래스 병합. `clsx`로 조건을 평가하고 `tailwind-merge`로 충돌을 정리한다.
 *
 * 템플릿 리터럴(`` `base ${className}` ``) 대신 쓰는 이유:
 * 1. `className`이 undefined여도 `"undefined"`라는 클래스가 들어가지 않는다
 * 2. 호출부가 넘긴 유틸리티가 기본값과 충돌하면 CSS 소스 순서가 아니라 나중 값이 이긴다
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
