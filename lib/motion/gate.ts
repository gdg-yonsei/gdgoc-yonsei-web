/**
 * 방문자의 움직임 줄이기·데이터 절약 설정을 읽어, 연출 청크를 내려받을지 정한다(클라이언트 전용).
 */

/** 방문자 설정: 움직임 줄이기, 데이터 절약. */
export type MotionEnvironment = {
  reducedMotion: boolean
  saveData: boolean
}

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean }
}

/** 브라우저에서 방문자 설정(움직임 줄이기, 데이터 절약)을 읽는다. */
export function readMotionEnvironment(win: Window = window): MotionEnvironment {
  return {
    reducedMotion:
      win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    saveData:
      (win.navigator as NavigatorWithConnection).connection?.saveData === true,
  }
}

/** 움직임을 원하고 데이터 절약을 켜지 않은 방문자에게만 연출 코드를 내려받는다.
    나머지는 정적 화면을 그대로 본다. */
export function shouldLoadMotion({
  reducedMotion,
  saveData,
}: MotionEnvironment): boolean {
  return !reducedMotion && !saveData
}
