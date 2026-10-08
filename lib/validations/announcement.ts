// 웹 폼 응답에 검증 오류가 그대로 보여 영어로 쓴다.
import { z } from 'zod'

// 공지 버튼은 다른 사이트로 보낼 수 없다. `//host`는 브라우저가 외부 주소로 해석한다.
function isAdminPath(href: string) {
  return /^\/admin(\/|\?|#|$)/.test(href) && !href.includes('//')
}

export const announcementValidation = z
  .object({
    title: z
      .string({ message: 'Title is required' })
      .trim()
      .min(1, 'Title is required')
      .max(100, 'Title must be 100 characters or fewer'),
    body: z
      .string({ message: 'Body is required' })
      .trim()
      .min(1, 'Body is required')
      .max(2000, 'Body must be 2000 characters or fewer'),
    ctaLabel: z
      .string()
      .trim()
      .min(1, 'Button label is required')
      .max(40, 'Button label must be 40 characters or fewer')
      .nullable(),
    ctaHref: z
      .string()
      .trim()
      .refine(
        isAdminPath,
        'Button link must be a GYMS path starting with /admin'
      )
      .nullable(),
  })
  .refine((data) => (data.ctaLabel === null) === (data.ctaHref === null), {
    message: 'Enter both the button label and link, or leave both empty',
    path: ['ctaHref'],
  })
