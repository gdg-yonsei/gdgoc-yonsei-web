/**
 * 숫자 카운트업 연출용 헬퍼.
 *
 * 홈 화면 연출(anime.js 장면, CSS 전환)이 쓰는 순수 계산 함수. DOM 없이 단위 테스트한다.
 */

/** "2,100" 같은 표기에서 숫자를 꺼낸다. 숫자가 없으면 null. */
export function parseCount(text: string): number | null {
  const digits = text.replace(/[^\d.]/g, '')
  return digits ? Number(digits) : null
}

/** 정수를 홈 화면 문구와 같은 형식(천 단위 쉼표)으로 쓴다. */
export function formatCount(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}
