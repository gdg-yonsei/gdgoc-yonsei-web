// env-core를 server-only로 감싸 비밀값 읽는 코드가 클라이언트 번들에 들어가면 빌드를 실패시킨다.
import 'server-only'

export * from './env-core'
