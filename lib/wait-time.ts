/**
 * 잠깐 기다리는 함수 (테스트 용)
 * @param time - 기다릴 시간 (ms)
 */
export default function waitTime(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}
