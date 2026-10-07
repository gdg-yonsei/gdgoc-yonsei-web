import 'react'

// React 19.3 passes these lowercase attributes through but @types/react does not declare them yet.
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 병합 선언은 원본과 같은 타입 매개변수를 가져야 한다
  interface ButtonHTMLAttributes<T> {
    command?: string
    commandfor?: string
  }
}
