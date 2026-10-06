// tailwind-merge 비용(약 9KB gz) 때문에 관리자 전용이다. 공개 사이트 클라이언트 번들에 넣지 않는다.
import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// 관리자 @utility를 등록해 같은 그룹에서 나중에 넘긴 클래스가 이기게 한다.
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

// 호출부 유틸리티가 기본값과 충돌하면 CSS 소스 순서가 아니라 나중 값이 이긴다.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
