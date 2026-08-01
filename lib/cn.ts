import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * `app/globals.css`에서 `@utility`로 등록한 관리자 프리미티브를 tailwind-merge에
 * 알려줍니다. 이렇게 해야 같은 그룹의 클래스가 충돌할 때 나중 값이 이깁니다.
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
      // 개별 Tailwind 유틸리티가 뒤에 오면 그쪽이 이겨야 합니다.
      'admin-type': ['font-size', 'font-weight', 'leading', 'tracking'],
    },
  },
})

/**
 * 조건부 클래스 병합. `clsx`로 조건을 평가하고 `tailwind-merge`로 충돌을 정리합니다.
 *
 * 템플릿 리터럴(`` `base ${className}` ``) 방식은 두 가지 문제가 있었습니다.
 * 1. `className`이 undefined면 문자열 `"undefined"`가 클래스로 주입됨
 * 2. 호출부가 넘긴 유틸리티가 기본값과 충돌해도 CSS 소스 순서로만 결정됨
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default cn
