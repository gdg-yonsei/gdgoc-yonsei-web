import { Locale } from '@/i18n-config'

/**
 * path에서 param으로 받은 lang 값을 ko 또는 en으로 변경하는 함수
 *
 * parma 값이 ko일때만 ko를 반환하고 다른 값일 경우 모두 en을 반환함
 * @param param - language path param
 */
export default function languageParamChecker(param: string): Locale {
  if (param === 'ko') {
    return 'ko'
  } else {
    return 'en'
  }
}
