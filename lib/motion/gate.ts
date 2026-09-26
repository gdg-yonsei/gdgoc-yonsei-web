export type MotionEnvironment = {
  reducedMotion: boolean
  saveData: boolean
}

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean }
}

/** What the visitor asked for: less motion, or less data. */
export function readMotionEnvironment(win: Window = window): MotionEnvironment {
  return {
    reducedMotion:
      win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    saveData:
      (win.navigator as NavigatorWithConnection).connection?.saveData === true,
  }
}

/** Motion code is downloaded only for visitors who want motion and have
    not asked to save data; everyone else keeps the static page. */
export function shouldLoadMotion({
  reducedMotion,
  saveData,
}: MotionEnvironment): boolean {
  return !reducedMotion && !saveData
}
