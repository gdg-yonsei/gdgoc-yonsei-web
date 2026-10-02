/**
 * 서버 컴포넌트용 최적화 `<img>`(클라이언트 런타임 없음).
 *
 * `next/image`의 `getImageProps`를 구성하는 두 내부 모듈을 직접 import한다.
 * `next/image` 자체를 import하면 그 클라이언트 컴포넌트까지 참조되고, 허브 페이지는
 * 모든 페이지의 헤더에서 prefetch되므로 이미지 런타임이 사이트 전체에 한 벌 더 실렸다.
 * 출력이 `getImageProps`와 같은지는 `tests/components/static-image.test.tsx`가 확인한다.
 * Next를 올릴 때 내부 경로가 바뀌면 이 import부터 확인한다.
 */
import {
  getImgProps,
  type ImageProps,
} from 'next/dist/shared/lib/get-img-props'
import defaultLoader from 'next/dist/shared/lib/image-loader'

/**
 * 서버에서 렌더링하는 최적화 `<img>`. 상호작용이 없는 일반 이미지에 쓴다.
 * props는 `next/image`와 같다.
 */
export default function StaticImage(props: ImageProps) {
  const { props: imgProps } = getImgProps(props, {
    defaultLoader,
    // next/image와 마찬가지로 빌드 시 `images` 설정 값으로 치환된다.
    imgConf: process.env.__NEXT_IMAGE_OPTS as never,
  })
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- alt는 getImgProps가 넣는다
  return <img {...imgProps} />
}
