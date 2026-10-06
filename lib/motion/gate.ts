export type MotionEnvironment = {
  reducedMotion: boolean
  saveData: boolean
}

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean }
}

export function readMotionEnvironment(win: Window = window): MotionEnvironment {
  return {
    reducedMotion:
      win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    saveData:
      (win.navigator as NavigatorWithConnection).connection?.saveData === true,
  }
}

// 움직임 줄이기·데이터 절약을 켜면 연출 청크를 내려받지 않고 정적 화면을 쓴다.
export function shouldLoadMotion({
  reducedMotion,
  saveData,
}: MotionEnvironment): boolean {
  return !reducedMotion && !saveData
}
