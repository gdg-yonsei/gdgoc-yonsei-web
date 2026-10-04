/**
 * 관리자 이미지 입력에서 쓰는 파일 미리보기. 읽기가 끝난 뒤에만 data URL을 반환한다.
 */

/** 파일을 data URL로 읽는다. 실패하면 호출부가 이전 미리보기를 유지하도록 오류를 전달한다. */
export function readImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read the file'))
    }
    reader.onerror = () =>
      reject(reader.error ?? new Error('Could not read the file'))
    reader.onabort = () => reject(new Error('File reading was aborted'))
    reader.readAsDataURL(file)
  })
}
