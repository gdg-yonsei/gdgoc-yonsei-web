/**
 * 선언문(manifesto) 단어 강조 연출용 헬퍼.
 *
 * 홈 화면 연출(anime.js 장면, CSS 전환)이 쓰는 순수 계산 함수. DOM 없이 단위 테스트한다.
 */

type Box = { left: number; top: number; width: number; height: number }

/** 지나간 정도(progress)에 따라 어느 단어까지 불이 켜졌는지.
    시작 전이면 -1, 다 지나가면 마지막 단어. */
export function wordIndexAt(progress: number, count: number): number {
  if (progress <= 0 || count === 0) return -1
  return Math.min(count - 1, Math.floor(progress * count))
}

/** 단어 뒤에 깔리는 괄호 띠의 위치와 크기. 단어 양옆으로 `reach`만큼(`< >` 홈 자리)
    넓히고, 높이는 `height`, 줄 가운데에 맞춘다. */
export function bandFrame(
  word: Box,
  { reach, height }: { reach: number; height: number }
) {
  return {
    x: word.left - reach,
    y: word.top + (word.height - height) / 2,
    width: word.width + reach * 2,
    height,
  }
}
